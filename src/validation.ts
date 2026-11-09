import type { ClassificationError } from './types.js';

export const MAX_INQUIRY_LENGTH = 2000;

export type ValidationOutcome =
  | { ok: true; text: string }
  | { ok: false; error: ClassificationError };

/**
 * Проверява и почиства входа. Не хвърля изключения – връща структурирана грешка.
 * Почистването маха управляващи символи (напр. от копирани имейли) и сгъстява интервалите.
 */
export function validateInput(input: unknown): ValidationOutcome {
  if (typeof input !== 'string') {
    return {
      ok: false,
      error: {
        code: 'INVALID_TYPE',
        message: 'Запитването трябва да е текст (string).',
      },
    };
  }

  const text = input
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length === 0) {
    return {
      ok: false,
      error: { code: 'EMPTY_INPUT', message: 'Запитването е празно.' },
    };
  }

  if (!/[\p{L}\p{N}]/u.test(text)) {
    return {
      ok: false,
      error: {
        code: 'NO_MEANINGFUL_TEXT',
        message: 'Запитването не съдържа букви или цифри.',
      },
    };
  }

  if (text.length > MAX_INQUIRY_LENGTH) {
    return {
      ok: false,
      error: {
        code: 'TOO_LONG',
        message: `Запитването е твърде дълго (максимум ${MAX_INQUIRY_LENGTH} символа).`,
      },
    };
  }

  return { ok: true, text };
}
