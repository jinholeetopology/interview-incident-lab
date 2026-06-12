import { describe, expect, it } from "vitest";
import { cacheInternals, type Cache, type CacheWithInternals } from "../src/cache.js";
import { createIdempotency } from "../src/idempotency.js";

const createMemoryCache = (): Cache => {
  const values = new Map<string, string>();
  const expirations = new Map<string, number>();
  const read = (key: string): string | null => {
    const expiresAt = expirations.get(key);
    if (expiresAt !== undefined && expiresAt <= Date.now()) {
      values.delete(key);
      expirations.delete(key);
      return null;
    }
    return values.get(key) ?? null;
  };

  const cache: CacheWithInternals = {
    async get<T>(key: string) {
      const raw = read(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    },
    async set(key: string, value: unknown, ttlSec: number) {
      values.set(key, JSON.stringify(value));
      expirations.set(key, Date.now() + ttlSec * 1000);
    },
    async del(...keys: string[]) {
      keys.forEach((key) => {
        values.delete(key);
        expirations.delete(key);
      });
    },
    async withCache<T>(key: string, ttlSec: number, loader: () => Promise<T>) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      const loaded = await loader();
      await this.set(key, loaded, ttlSec);
      return loaded;
    },
    async close() {
      values.clear();
      expirations.clear();
    },
    [cacheInternals]: {
      prefixKey: (key: string) => key,
      setNx: async (key: string, value: string, ttlSec: number) => {
        if (read(key) !== null) {
          return false;
        }
        values.set(key, value);
        expirations.set(key, Date.now() + ttlSec * 1000);
        return true;
      },
      getRaw: async (key: string) => read(key),
      delRaw: async (key: string) => {
        values.delete(key);
        expirations.delete(key);
      }
    }
  };
  return cache;
};

describe("createIdempotency", () => {
  it("runs a function once for concurrent calls with the same key", async () => {
    const idempotency = createIdempotency(createMemoryCache());
    let executions = 0;

    const work = () =>
      idempotency.run("payments:capture:abc", 5, async () => {
        executions += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { captured: true };
      });

    const [first, second] = await Promise.all([work(), work()]);
    expect(first.result).toEqual({ captured: true });
    expect(second.result).toEqual({ captured: true });
    expect([first.replayed, second.replayed].sort()).toEqual([false, true]);
    expect(executions).toBe(1);
  });
});
