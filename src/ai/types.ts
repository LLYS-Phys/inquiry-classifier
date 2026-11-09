import type { Category } from '../types.js';

export interface AiClassification {
  category: Category;
  confidence: number;
  reason?: string;
}

/** Абстракция над външна AI услуга – позволява смяна на доставчик и лесно тестване. */
export interface AiClassifier {
  readonly name: string;
  classify(text: string): Promise<AiClassification>;
}

/** Грешка, при която повторен опит няма смисъл (напр. неразбираем отговор на модела). */
export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiResponseError';
  }
}

/** Временна грешка (мрежа, таймаут, 429, 5xx) – разумно е повторение/fallback. */
export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiUnavailableError';
  }
}
