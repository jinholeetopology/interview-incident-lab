import { RATE_LIMIT_PREFIX } from '../constants/redisKeys.js';
import { sha256Hex } from '../utils/hash.js';

export interface RateLimitRedis {
  eval(script: string, keyCount: number, ...args: Array<string | number>): Promise<unknown>;
}

export interface RateLimitCounter {
  count: number;
  ttlSec: number;
}

const INCREMENT_WINDOW_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return { count, ttl }
`;

export class RateLimitRepository {
  constructor(private readonly redis: RateLimitRedis) {}

  async increment(apiKey: string, windowSec: number): Promise<RateLimitCounter> {
    const redisKey = this.keyFor(apiKey);
    const result = await this.redis.eval(INCREMENT_WINDOW_SCRIPT, 1, redisKey, windowSec);

    if (!Array.isArray(result) || result.length !== 2) {
      throw new Error('Unexpected Redis rate limit response');
    }

    return {
      count: Number(result[0]),
      ttlSec: Math.max(0, Number(result[1]))
    };
  }

  keyFor(apiKey: string): string {
    return `${RATE_LIMIT_PREFIX}:${sha256Hex(apiKey)}`;
  }
}
