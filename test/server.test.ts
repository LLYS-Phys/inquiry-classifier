import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { InquiryClassifier } from '../src/classifier.js';
import { createApp } from '../src/server.js';

// Сървърът се стартира в before() ВЪТРЕ в describe – така е гарантирано, че е готов
// преди тестовете при всички версии на Node (top-level hooks се държат различно).
describe('HTTP API', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createApp(new InquiryClassifier({ logger: { warn: () => {} } }));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function post(body: string) {
    const res = await fetch(`${baseUrl}/api/classify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    return { status: res.status, json: (await res.json()) as any };
  }

  describe('POST /api/classify', () => {
    it('200 + JSON за валидно запитване', async () => {
      const { status, json } = await post(
        JSON.stringify({ text: 'Видеоурокът по математика не се зарежда.' }),
      );
      assert.equal(status, 200);
      assert.equal(json.category, 'technical_issue');
      assert.equal(json.categoryLabel, 'Технически проблем');
      assert.equal(typeof json.confidence, 'number');
    });

    it('400 за празен текст', async () => {
      const { status, json } = await post(JSON.stringify({ text: '   ' }));
      assert.equal(status, 400);
      assert.equal(json.error.code, 'EMPTY_INPUT');
    });

    it('400 при липсващо поле text', async () => {
      const { status, json } = await post(JSON.stringify({}));
      assert.equal(status, 400);
      assert.equal(json.error.code, 'INVALID_TYPE');
    });

    it('400 при невалиден JSON', async () => {
      const { status, json } = await post('{not json');
      assert.equal(status, 400);
      assert.equal(json.error.code, 'INVALID_JSON');
    });

    it('413 при твърде дълъг текст', async () => {
      const { status, json } = await post(JSON.stringify({ text: 'а'.repeat(3000) }));
      assert.equal(status, 413);
      assert.equal(json.error.code, 'TOO_LONG');
    });
  });

  describe('GET /health', () => {
    it('връща ok', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { status: 'ok' });
    });
  });
});
