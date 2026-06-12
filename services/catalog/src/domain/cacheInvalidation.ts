import type { Cache } from "@atlas/shared";
import { enumeratePriceCacheKeys, productCacheKey } from "./cacheKeys.js";

const CACHE_DEL_CHUNK_SIZE = 500;

export interface ProductCacheInvalidationOptions {
  product?: boolean;
  prices?: boolean;
}

export async function invalidateProductCaches(
  cache: Cache,
  productId: string,
  options: ProductCacheInvalidationOptions = { product: true, prices: true }
): Promise<void> {
  const keys: string[] = [];

  if (options.product ?? true) {
    keys.push(productCacheKey(productId));
  }

  if (options.prices ?? true) {
    keys.push(...enumeratePriceCacheKeys(productId));
  }

  for (let index = 0; index < keys.length; index += CACHE_DEL_CHUNK_SIZE) {
    await cache.del(...keys.slice(index, index + CACHE_DEL_CHUNK_SIZE));
  }
}

export async function invalidatePriceCaches(cache: Cache, productId: string): Promise<void> {
  await invalidateProductCaches(cache, productId, { product: false, prices: true });
}
