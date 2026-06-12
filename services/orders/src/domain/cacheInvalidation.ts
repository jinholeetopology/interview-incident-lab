import type { Cache } from "@atlas/shared";
import { orderCacheKey, orderTimelineCacheKey } from "../cacheKeys.js";

export const invalidateOrderCache = async (
  cache: Cache,
  orderId: string
): Promise<void> => {
  await cache.del(orderCacheKey(orderId), orderTimelineCacheKey(orderId));
};
