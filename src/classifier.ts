import type { AiClassifier } from './ai/types.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { classifyWithRules } from './rules.js';
import {
  CATEGORY_LABELS,
  type Category,
  type ClassificationResult,
  type ClassifyOutcome,
  type Source,
} from './types.js';
import { validateInput } from './validation.js';

export interface ClassifierOptions {
  /** Ако липсва, работим само с правила. */
  ai?: AiClassifier;
  breaker?: CircuitBreaker;
  /** Над този праг резултатът от правилата се приема без AI. */
  acceptThreshold?: number;
  /** Под този праг резултатът се маркира за ръчно преглеждане. */
  reviewThreshold?: number;
  logger?: Pick<Console, 'warn'>;
}

/**
 * Хибриден оркестратор:
 *   1. валидация на входа
 *   2. правила (евтини, бързи, обясними)
 *   3. само при несигурност → AI модел (през circuit breaker)
 *   4. при проблем с AI → резултатът от правилата, маркиран за преглед
 */
export class InquiryClassifier {
  private readonly ai?: AiClassifier;
  private readonly breaker: CircuitBreaker;
  private readonly acceptThreshold: number;
  private readonly reviewThreshold: number;
  private readonly logger: Pick<Console, 'warn'>;

  constructor(options: ClassifierOptions = {}) {
    this.ai = options.ai;
    this.breaker = options.breaker ?? new CircuitBreaker();
    this.acceptThreshold = options.acceptThreshold ?? 0.7;
    this.reviewThreshold = options.reviewThreshold ?? 0.6;
    this.logger = options.logger ?? console;
  }

  async classify(input: unknown): Promise<ClassifyOutcome> {
    const validated = validateInput(input);
    if (!validated.ok) return { ok: false, error: validated.error };

    try {
      return { ok: true, result: await this.classifyText(validated.text) };
    } catch (error) {
      this.logger.warn('Неочаквана грешка при класификация:', error);
      return {
        ok: false,
        error: { code: 'INTERNAL_ERROR', message: 'Неочаквана вътрешна грешка.' },
      };
    }
  }

  private async classifyText(text: string): Promise<ClassificationResult> {
    const rules = classifyWithRules(text);

    // Ясен победител И никаква друга категория с реално доказателство → без AI.
    // Смесените запитвания (competing) отиват към AI дори при висока увереност.
    if (rules.confidence >= this.acceptThreshold && !rules.competing) {
      return this.build(rules.category, rules.confidence, 'rules', rules.signals, {
        needsReview: false,
      });
    }

    if (!this.ai) {
      return this.build(rules.category, rules.confidence, 'rules', rules.signals, {
        needsReview: rules.confidence < this.reviewThreshold || rules.competing,
        reason: rules.noEvidence
          ? 'Няма достатъчно сигнали в текста.'
          : rules.competing
            ? 'Запитването съдържа сигнали за повече от една категория.'
            : undefined,
      });
    }

    const ai = this.ai;
    try {
      const aiResult = await this.breaker.exec(() => ai.classify(text));
      return this.build(aiResult.category, aiResult.confidence, 'ai', rules.signals, {
        needsReview: aiResult.confidence < this.reviewThreshold,
        reason: aiResult.reason,
      });
    } catch (error) {
      this.logger.warn(`AI услугата е недостъпна, използваме правилата: ${(error as Error).message}`);
      return this.build(rules.category, rules.confidence, 'rules-fallback', rules.signals, {
        // Не сме успели да потвърдим несигурния резултат → човек да го погледне.
        needsReview: true,
        reason: 'AI услугата е временно недостъпна; резултатът е от правилата.',
      });
    }
  }

  private build(
    category: Category,
    confidence: number,
    source: Source,
    signals: string[],
    extra: { needsReview: boolean; reason?: string },
  ): ClassificationResult {
    return {
      category,
      categoryLabel: CATEGORY_LABELS[category],
      confidence,
      source,
      needsReview: extra.needsReview,
      signals,
      ...(extra.reason ? { reason: extra.reason } : {}),
    };
  }
}
