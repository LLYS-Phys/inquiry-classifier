export const CATEGORIES = [
  'technical_issue',
  'access_registration',
  'learning_content',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  technical_issue: 'Технически проблем',
  access_registration: 'Достъп или регистрация',
  learning_content: 'Учебно съдържание',
  other: 'Друго',
};

/**
 * Откъде идва крайният отговор:
 *  - rules          – правилата са били достатъчно уверени
 *  - ai             – правилата са били несигурни, AI моделът е решил
 *  - rules-fallback – AI услугата е била недостъпна, върнат е резултатът от правилата
 */
export type Source = 'rules' | 'ai' | 'rules-fallback';

export interface ClassificationResult {
  category: Category;
  categoryLabel: string;
  /** Оценка 0..1. Не е калибрирана вероятност, а ориентир за автоматично/ръчно разпределяне. */
  confidence: number;
  source: Source;
  /** true => насочете запитването към човек за ръчно преглеждане. */
  needsReview: boolean;
  /** Кои сигнали (ключови думи/фрази) са засечени от правилата. */
  signals: string[];
  /** Кратко обяснение (идва от AI модела или от режима на отказ). */
  reason?: string;
}

export type ErrorCode =
  | 'INVALID_TYPE'
  | 'EMPTY_INPUT'
  | 'NO_MEANINGFUL_TEXT'
  | 'TOO_LONG'
  | 'INVALID_JSON'
  | 'INTERNAL_ERROR';

export interface ClassificationError {
  code: ErrorCode;
  message: string;
}

export type ClassifyOutcome =
  | { ok: true; result: ClassificationResult }
  | { ok: false; error: ClassificationError };
