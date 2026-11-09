export class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker е отворен – външната услуга временно не се извиква.');
    this.name = 'CircuitOpenError';
  }
}

export interface CircuitBreakerOptions {
  /** Брой поредни грешки, след които веригата се отваря. */
  failureThreshold?: number;
  /** Колко време веригата остава отворена, преди да пробва отново (ms). */
  cooldownMs?: number;
  now?: () => number;
}

/**
 * Минимален circuit breaker. Когато AI услугата е недостъпна, спираме да я викаме
 * за известно време – така не трупаме забавяне (таймаути) за всяка заявка и
 * не натоварваме услугата, докато се възстановява.
 *
 * closed → (N поредни грешки) → open → (след cooldown) → half-open → успех: closed / грешка: open
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  private trialInFlight = false;

  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30_000;
    this.now = options.now ?? Date.now;
  }

  get state(): 'closed' | 'open' | 'half-open' {
    if (this.openedAt === null) return 'closed';
    return this.now() - this.openedAt >= this.cooldownMs ? 'half-open' : 'open';
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.state;
    if (state === 'open' || (state === 'half-open' && this.trialInFlight)) {
      throw new CircuitOpenError();
    }
    if (state === 'half-open') this.trialInFlight = true;

    try {
      const result = await fn();
      this.failures = 0;
      this.openedAt = null;
      return result;
    } catch (error) {
      this.failures++;
      if (state === 'half-open' || this.failures >= this.failureThreshold) {
        this.openedAt = this.now();
      }
      throw error;
    } finally {
      this.trialInFlight = false;
    }
  }
}
