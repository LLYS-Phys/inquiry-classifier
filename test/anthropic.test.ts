import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AnthropicClassifier, parseModelOutput } from '../src/ai/anthropic.js';
import { AiResponseError, AiUnavailableError } from '../src/ai/types.js';

function apiResponse(text: string, status = 200): Response {
  return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function makeClient(responses: (Response | Error)[]) {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    const next = responses[Math.min(calls++, responses.length - 1)]!;
    if (next instanceof Error) throw next;
    return next.clone();
  };
  const client = new AnthropicClassifier({
    apiKey: 'test',
    fetchImpl,
    sleep: async () => {},
    maxRetries: 1,
  });
  return { client, calls: () => calls };
}

describe('AnthropicClassifier', () => {
  it('парсира валиден отговор', async () => {
    const { client } = makeClient([
      apiResponse('{"category":"technical_issue","confidence":0.91,"reason":"Не се зарежда."}'),
    ]);
    const r = await client.classify('видеото не се зарежда');
    assert.deepEqual(r, { category: 'technical_issue', confidence: 0.91, reason: 'Не се зарежда.' });
  });

  it('повтаря при 429 и успява', async () => {
    const { client, calls } = makeClient([
      new Response('', { status: 429 }),
      apiResponse('{"category":"other","confidence":0.7}'),
    ]);
    const r = await client.classify('нещо');
    assert.equal(r.category, 'other');
    assert.equal(calls(), 2);
  });

  it('хвърля AiUnavailableError след изчерпване на опитите', async () => {
    const { client, calls } = makeClient([new Response('', { status: 503 })]);
    await assert.rejects(client.classify('нещо'), AiUnavailableError);
    assert.equal(calls(), 2); // 1 опит + 1 повторение
  });

  it('мрежова грешка/таймаут се третира като недостъпност', async () => {
    const { client } = makeClient([new Error('network down')]);
    await assert.rejects(client.classify('нещо'), AiUnavailableError);
  });

  it('не повтаря при 4xx (напр. грешен ключ)', async () => {
    const { client, calls } = makeClient([new Response('', { status: 401 })]);
    await assert.rejects(client.classify('нещо'), AiResponseError);
    assert.equal(calls(), 1);
  });
});

describe('parseModelOutput', () => {
  it('извлича JSON, обграден с текст или code fence', () => {
    const r = parseModelOutput('Ето резултата:\n```json\n{"category":"learning_content","confidence":0.8}\n```');
    assert.equal(r.category, 'learning_content');
  });

  it('отхвърля непозната категория (напр. при prompt injection)', () => {
    assert.throws(() => parseModelOutput('{"category":"admin_access","confidence":1}'), AiResponseError);
  });

  it('отхвърля текст без JSON и невалиден JSON', () => {
    assert.throws(() => parseModelOutput('Не знам.'), AiResponseError);
    assert.throws(() => parseModelOutput('{category: other}'), AiResponseError);
  });

  it('ограничава confidence в [0, 1] и подменя липсващ', () => {
    assert.equal(parseModelOutput('{"category":"other","confidence":7}').confidence, 1);
    assert.equal(parseModelOutput('{"category":"other","confidence":-2}').confidence, 0);
    assert.equal(parseModelOutput('{"category":"other"}').confidence, 0.5);
  });
});
