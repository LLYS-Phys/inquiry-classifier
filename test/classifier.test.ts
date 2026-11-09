import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MockAiClassifier } from '../src/ai/mock.js';
import { CircuitBreaker } from '../src/circuit-breaker.js';
import { InquiryClassifier } from '../src/classifier.js';

const silent = { warn: () => {} };
const CLEAR = 'Не мога да вляза в профила си, въпреки че паролата е правилна.';
const AMBIGUOUS = 'Здравейте, имам един въпрос.';
const MIXED =
  'Получавам грешка, когато се опитам да вляза в профила си с парола и да се регистрирам.';

function result(outcome: Awaited<ReturnType<InquiryClassifier['classify']>>) {
  assert.ok(outcome.ok, 'очаквахме успешен резултат');
  return outcome.result;
}

describe('InquiryClassifier', () => {
  it('връща структуриран резултат за ясно запитване без да вика AI', async () => {
    const ai = new MockAiClassifier();
    const c = new InquiryClassifier({ ai, logger: silent });

    const r = result(await c.classify(CLEAR));
    assert.equal(r.category, 'access_registration');
    assert.equal(r.categoryLabel, 'Достъп или регистрация');
    assert.equal(r.source, 'rules');
    assert.equal(r.needsReview, false);
    assert.equal(ai.calls, 0);
  });

  it('при несигурност от правилата вика AI', async () => {
    const ai = new MockAiClassifier();
    const c = new InquiryClassifier({ ai, logger: silent });

    const r = result(await c.classify(AMBIGUOUS));
    assert.equal(r.source, 'ai');
    assert.equal(r.category, 'other');
    assert.equal(ai.calls, 1);
  });

  it('без AI работи само с правила и маркира несигурните за преглед', async () => {
    const c = new InquiryClassifier({ logger: silent });
    const r = result(await c.classify(AMBIGUOUS));
    assert.equal(r.source, 'rules');
    assert.equal(r.needsReview, true);
  });

  it('при недостъпен AI пада обратно към правилата и иска преглед', async () => {
    const ai = new MockAiClassifier({ fail: true });
    const c = new InquiryClassifier({ ai, logger: silent });

    const r = result(await c.classify(AMBIGUOUS));
    assert.equal(r.source, 'rules-fallback');
    assert.equal(r.needsReview, true);
  });

  it('смесено запитване (повече от една категория) се подава към AI', async () => {
    const ai = new MockAiClassifier();
    const c = new InquiryClassifier({ ai, logger: silent });

    for (const text of [MIXED, 'не мога да пусна урок защото не мога да си вляза в профила']) {
      const r = result(await c.classify(text));
      assert.equal(r.source, 'ai', text);
    }
    assert.equal(ai.calls, 2);
  });

  it('смесено запитване при недостъпен AI → най-силната категория от правилата + преглед', async () => {
    const c = new InquiryClassifier({ ai: new MockAiClassifier({ fail: true }), logger: silent });

    const r = result(await c.classify(MIXED));
    assert.equal(r.source, 'rules-fallback');
    assert.equal(r.category, 'access_registration');
    assert.equal(r.needsReview, true);
  });

  it('смесено запитване без AI → правилата + преглед', async () => {
    const c = new InquiryClassifier({ logger: silent });
    const r = result(await c.classify(MIXED));
    assert.equal(r.source, 'rules');
    assert.equal(r.needsReview, true);
  });

  it('невалиден вход връща структурирана грешка, не хвърля', async () => {
    const c = new InquiryClassifier({ logger: silent });
    for (const bad of ['', '   ', null, undefined, 123]) {
      const out = await c.classify(bad);
      assert.equal(out.ok, false);
    }
  });

  it('circuit breaker спира извикванията към AI след поредни грешки', async () => {
    const ai = new MockAiClassifier({ fail: true });
    const breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 60_000 });
    const c = new InquiryClassifier({ ai, breaker, logger: silent });

    for (let i = 0; i < 6; i++) await c.classify(AMBIGUOUS);

    assert.equal(ai.calls, 3, 'след 3 грешки AI не трябва да се вика повече');
    assert.equal(breaker.state, 'open');
  });

  it('circuit breaker се възстановява след cooldown', async () => {
    let now = 0;
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, now: () => now });

    await assert.rejects(breaker.exec(() => Promise.reject(new Error('x'))));
    assert.equal(breaker.state, 'open');

    now = 1500;
    assert.equal(breaker.state, 'half-open');
    assert.equal(await breaker.exec(() => Promise.resolve('ok')), 'ok');
    assert.equal(breaker.state, 'closed');
  });
});
