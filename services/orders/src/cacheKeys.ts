export const orderCacheKey = (orderId: string): string => `order:${orderId}`;

export const orderTimelineCacheKey = (orderId: string): string =>
  `order:${orderId}:timeline`;

export const readyCacheKey = (): string => "ready:orders";
