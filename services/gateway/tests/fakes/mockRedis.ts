import { API_KEY_SET, RATE_LIMIT_PREFIX } from '../../src/constants/redisKeys.js';
import { sha256Hex } from '../../src/utils/hash.js';

interface CounterRecord {
  count: number;
  expiresAtMs: number;
}

export class MockRedis {
  readonly sets = new Map<string, Set<string>>();
  readonly counters = new Map<string, CounterRecord>();
  nowMs = 1_700_000_000_000;

  async eval(_script: string, _keyCount: number, key: string, ...args: Array<string | number>): Promise<unknown> {
    if (key === API_KEY_SET) {
      const values = args.map(String);
      this.sets.set(key, new Set(values));
      return values.length;
    }

    if (key.startsWith(`${RATE_LIMIT_PREFIX}:`)) {
      const windowSec = Number(args[0]);
      const current = this.counters.get(key);
      const active = current && current.expiresAtMs > this.nowMs ? current : undefined;
      const next: CounterRecord = {
        count: (active?.count ?? 0) + 1,
        expiresAtMs: active?.expiresAtMs ?? this.nowMs + windowSec * 1000
      };
      this.counters.set(key, next);
      return [next.count, Math.ceil((next.expiresAtMs - this.nowMs) / 1000)];
    }

    throw new Error(`Unexpected eval key: ${key}`);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.sets.get(key)?.has(member) ? 1 : 0;
  }

  counterForApiKey(apiKey: string): CounterRecord | undefined {
    return this.counters.get(`${RATE_LIMIT_PREFIX}:${sha256Hex(apiKey)}`);
  }

  advance(ms: number): void {
    this.nowMs += ms;
  }
}
