import express, { type ErrorRequestHandler } from 'express';
import type { InquiryClassifier } from './classifier.js';
import type { ErrorCode } from './types.js';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  INVALID_TYPE: 400,
  EMPTY_INPUT: 400,
  NO_MEANINGFUL_TEXT: 400,
  INVALID_JSON: 400,
  TOO_LONG: 413,
  INTERNAL_ERROR: 500,
};

export function createApp(classifier: InquiryClassifier): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // POST /api/classify  { "text": "..." }
  app.post('/api/classify', async (req, res) => {
    const text: unknown = req.body?.text;
    const outcome = await classifier.classify(text);

    if (outcome.ok) {
      res.json(outcome.result);
    } else {
      res.status(STATUS_BY_CODE[outcome.error.code]).json({ error: outcome.error });
    }
  });

  // Невалиден JSON или твърде голямо тяло → същият формат на грешка.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ error: { code: 'TOO_LONG', message: 'Заявката е твърде голяма.' } });
    } else if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Невалиден JSON.' } });
    } else {
      console.error(err);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Вътрешна грешка.' } });
    }
  };
  app.use(errorHandler);

  return app;
}
