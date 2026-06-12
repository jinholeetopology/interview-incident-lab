import { describe, expect, it } from 'vitest';
import { RateLimiter } from '../src/domain/rateLimiter.js';
import { RateLimitRepository } from '../src/repositories/rateLimitRepository.js';
import { MockRedis } from './fakes/mockRedis.js';

describe('RateLimiter', () => {
  it('allows requests up to the configured window limit', async () => {
    const redis = new MockRedis();
    const limiter = new RateLimiter(new RateLimitRepository(redis), { limit: 2, windowSec: 10 });

    await expect(limiter.check('demo-key-1')).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
      resetAfterSec: 10
    });
    await expect(limiter.check('demo-key-1')).resolves.toMatchObject({
      allowed: true,
      remaining: 0
    });
  });

  it('rejects excess requests and reopens after the Redis window expires', async () => {
    const redis = new MockRedis();
    const limiter = new RateLimiter(new RateLimitRepository(redis), { limit: 1, windowSec: 10 });

    await expect(limiter.check('demo-key-1')).resolves.toMatchObject({ allowed: true });
    await expect(limiter.check('demo-key-1')).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSec: 10
    });

    redis.advance(10_001);

    await expect(limiter.check('demo-key-1')).resolves.toMatchObject({
      allowed: true,
      remaining: 0
    });
  });

  it('keeps counters isolated per API key', async () => {
    const redis = new MockRedis();
    const limiter = new RateLimiter(new RateLimitRepository(redis), { limit: 1, windowSec: 10 });

    await limiter.check('demo-key-1');
    await limiter.check('demo-key-2');

    expect(redis.counterForApiKey('demo-key-1')?.count).toBe(1);
    expect(redis.counterForApiKey('demo-key-2')?.count).toBe(1);
  });
});
