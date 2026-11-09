import type { Category } from '../types.js';
import {
  AiUnavailableError,
  type AiClassification,
  type AiClassifier,
} from './types.js';

export interface MockAiOptions {
  /** Симулира недостъпна AI услуга. */
  fail?: boolean;
  /** Симулирана латентност (ms). */
  latencyMs?: number;
}

/**
 * Примерна (mock) AI услуга за демонстрация и тестове – не прави мрежови заявки.
 * Връща предварително зададени отговори за двусмислените примери и
 * "уверено Друго" за всичко останало.
 */
export class MockAiClassifier implements AiClassifier {
  readonly name = 'mock';
  calls = 0;

  constructor(private readonly options: MockAiOptions = {}) {}

  async classify(text: string): Promise<AiClassification> {
    this.calls++;
    if (this.options.latencyMs) {
      await new Promise((r) => setTimeout(r, this.options.latencyMs));
    }
    if (this.options.fail) {
      throw new AiUnavailableError('Mock: AI услугата е недостъпна');
    }

    const lower = text.toLocaleLowerCase('bg');
    const canned: [RegExp[], Category, string][] = [
      [[/урок/u, /упражнен/u, /клас/u, /тест/u], 'learning_content', 'Пита за учебни материали.'],
      [[/парол/u, /профил/u, /регистр/u, /вход/u, /вляз/u], 'access_registration', 'Свързано е с достъп до профила.'],
      [[/не (се )?(зарежд|работи|отвар|пуск)/u, /не мога да пусна/u, /грешк/u], 'technical_issue', 'Описва нещо, което не работи.'],
    ];

    // Печели категорията с най-много съвпадения (а не първата, която съвпадне).
    let best: { category: Category; reason: string; hits: number } | undefined;
    for (const [patterns, category, reason] of canned) {
      const hits = patterns.filter((p) => p.test(lower)).length;
      if (hits > 0 && (!best || hits > best.hits)) best = { category, reason, hits };
    }
    if (best) {
      return { category: best.category, confidence: 0.82, reason: `[mock] ${best.reason}` };
    }
    return {
      category: 'other',
      confidence: 0.8,
      reason: '[mock] Не попада в основните категории.',
    };
  }
}
