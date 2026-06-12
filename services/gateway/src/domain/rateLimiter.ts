import type { RateLimitRepository } from '../repositories/rateLimitRepository.js';

export interface RateLimitOptions {
  limit: number;
  windowSec: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
  resetAfterSec: number;
}

export class RateLimiter {
  constructor(
    private readonly repository: RateLimitRepository,
    private readonly options: RateLimitOptions = { limit: 120, windowSec: 10 }
  ) {}

  async check(apiKey: string): Promise<RateLimitDecision> {
    const counter = await this.repository.increment(apiKey, this.options.windowSec);
    const remaining = Math.max(0, this.options.limit - counter.count);
    const resetAfterSec = counter.ttlSec > 0 ? counter.ttlSec : this.options.windowSec;

    return {
      allowed: counter.count <= this.options.limit,
      limit: this.options.limit,
      remaining,
      retryAfterSec: resetAfterSec,
      resetAfterSec
    };
  }
}
