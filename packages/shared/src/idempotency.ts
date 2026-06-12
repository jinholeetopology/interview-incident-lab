import { randomUUID } from "node:crypto";
import { cacheInternals, type Cache, type CacheWithInternals } from "./cache.js";
import { ConflictError } from "./errors.js";

export interface Idempotency {
  run<T>(
    key: string,
    ttlSec: number,
    fn: () => Promise<T>
  ): Promise<{ result: T; replayed: boolean }>;
}

type StoredResult<T> = {
  ok: true;
  result: T;
};

type StoredRead<T> =
  | { found: true; result: T }
  | { found: false };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const hasInternals = (cache: Cache): cache is CacheWithInternals => cacheInternals in cache;

export const createIdempotency = (cache: Cache): Idempotency => {
  if (!hasInternals(cache)) {
    throw new Error("createIdempotency requires a Redis-backed cache");
  }

  const internals = cache[cacheInternals];

  const readStored = async <T>(resultKey: string): Promise<StoredRead<T>> => {
    const stored = await cache.get<StoredResult<T>>(resultKey);
    return stored?.ok ? { found: true, result: stored.result } : { found: false };
  };

  return {
    async run<T>(key: string, ttlSec: number, fn: () => Promise<T>) {
      const resultKey = `idempotency:result:${key}`;
      const lockKey = `idempotency:lock:${key}`;

      const existing = await readStored<T>(resultKey);
      if (existing.found) {
        return { result: existing.result, replayed: true };
      }

      const token = randomUUID();
      const acquired = await internals.setNx(lockKey, token, ttlSec);
      if (acquired) {
        try {
          const result = await fn();
          await cache.set(resultKey, { ok: true, result } satisfies StoredResult<T>, ttlSec);
          return { result, replayed: false };
        } catch (err) {
          const currentToken = await internals.getRaw(lockKey);
          if (currentToken === token) {
            await internals.delRaw(lockKey);
          }
          throw err;
        } finally {
          const currentToken = await internals.getRaw(lockKey);
          if (currentToken === token) {
            await internals.delRaw(lockKey);
          }
        }
      }

      const deadline = Date.now() + Math.min(Math.max(ttlSec * 1000, 250), 5000);
      while (Date.now() < deadline) {
        await sleep(50);
        const replayed = await readStored<T>(resultKey);
        if (replayed.found) {
          return { result: replayed.result, replayed: true };
        }

        const lockStillHeld = await internals.getRaw(lockKey);
        if (lockStillHeld === null) {
          return this.run(key, ttlSec, fn);
        }
      }

      throw new ConflictError("Idempotent operation is still in progress", { key });
    }
  };
};
