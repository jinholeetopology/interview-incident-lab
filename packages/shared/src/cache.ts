import { Redis } from "ioredis";

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSec: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  withCache<T>(key: string, ttlSec: number, loader: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export type CacheInternals = {
  prefixKey(key: string): string;
  setNx(key: string, value: string, ttlSec: number): Promise<boolean>;
  getRaw(key: string): Promise<string | null>;
  delRaw(key: string): Promise<void>;
};

export const cacheInternals: unique symbol = Symbol("atlas.cacheInternals");

export type CacheWithInternals = Cache & {
  [cacheInternals]: CacheInternals;
};

const parseJson = <T>(raw: string | null): T | null => {
  if (raw === null) {
    return null;
  }
  return JSON.parse(raw) as T;
};

export const createCache = (cfg: { url: string; prefix: string }): Cache => {
  const redis = new Redis(cfg.url, { lazyConnect: false });
  const normalizedPrefix = cfg.prefix.endsWith(":") ? cfg.prefix : `${cfg.prefix}:`;
  const prefixKey = (key: string) => `${normalizedPrefix}${key}`;

  const cache: CacheWithInternals = {
    async get<T>(key: string) {
      return parseJson<T>(await redis.get(prefixKey(key)));
    },
    async set(key: string, value: unknown, ttlSec: number) {
      await redis.set(prefixKey(key), JSON.stringify(value), "EX", ttlSec);
    },
    async del(...keys: string[]) {
      if (keys.length === 0) {
        return;
      }
      await redis.del(...keys.map(prefixKey));
    },
    async withCache<T>(key: string, ttlSec: number, loader: () => Promise<T>) {
      const cached = await cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      const loaded = await loader();
      await cache.set(key, loaded, ttlSec);
      return loaded;
    },
    async close() {
      redis.disconnect();
    },
    [cacheInternals]: {
      prefixKey,
      setNx: async (key: string, value: string, ttlSec: number) => {
        const response = await redis.set(prefixKey(key), value, "EX", ttlSec, "NX");
        return response === "OK";
      },
      getRaw: (key: string) => redis.get(prefixKey(key)),
      delRaw: async (key: string) => {
        await redis.del(prefixKey(key));
      }
    }
  };

  return cache;
};
