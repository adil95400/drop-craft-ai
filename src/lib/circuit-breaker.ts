/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by failing fast when a service is down
 */

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold: number;    // failures before opening
  resetTimeout: number;        // ms before half-open
  halfOpenMaxAttempts: number; // attempts in half-open
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30_000,
  halfOpenMaxAttempts: 2,
};

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;
  private readonly options: CircuitBreakerOptions;
  readonly name: string;

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new CircuitBreakerError(
        `Circuit breaker "${this.name}" is OPEN. Retry after ${this.msUntilReset()}ms`,
        this.name,
        this.state
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    if (this.state === 'closed') return true;

    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.transition('half-open');
        return true;
      }
      return false;
    }

    // half-open
    return this.halfOpenAttempts < this.options.halfOpenMaxAttempts;
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.options.halfOpenMaxAttempts) {
        this.reset();
      }
    } else {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      this.transition('open');
    } else if (this.failures >= this.options.failureThreshold) {
      this.transition('open');
    }
  }

  private transition(to: CircuitState): void {
    const from = this.state;
    this.state = to;
    this.halfOpenAttempts = 0;
    this.successes = 0;
    if (to === 'closed') this.failures = 0;
    this.options.onStateChange?.(from, to);
  }

  private reset(): void {
    this.transition('closed');
  }

  private msUntilReset(): number {
    return Math.max(0, this.options.resetTimeout - (Date.now() - this.lastFailureTime));
  }

  getState(): { state: CircuitState; failures: number; lastFailure: number } {
    return { state: this.state, failures: this.failures, lastFailure: this.lastFailureTime };
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly circuitName: string,
    public readonly circuitState: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// Registry of circuit breakers
const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options));
  }
  return breakers.get(name)!;
}

// Pre-configured breakers for critical services
export const circuitBreakers = {
  supabase: getCircuitBreaker('supabase', { failureThreshold: 5, resetTimeout: 30_000 }),
  ai: getCircuitBreaker('ai', { failureThreshold: 3, resetTimeout: 60_000 }),
  sync: getCircuitBreaker('sync', { failureThreshold: 4, resetTimeout: 45_000 }),
  import: getCircuitBreaker('import', { failureThreshold: 3, resetTimeout: 60_000 }),
};

/**
 * Retry with exponential backoff + jitter
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30_000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.min(baseDelay * 2 ** attempt + Math.random() * 1000, maxDelay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}
