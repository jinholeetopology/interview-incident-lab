import { CUSTOMER_TIERS, type CustomerTier } from "./types.js";
import { SUPPORTED_CURRENCIES, type Currency } from "./currency.js";

export const PRODUCT_CACHE_TTL_SEC = 60;
export const PRICE_CACHE_TTL_SEC = 60;
export const PRICE_CACHE_QTY_MIN = 1;
export const PRICE_CACHE_QTY_MAX = 1000;

export function productCacheKey(productId: string): string {
  return `catalog:product:${productId}`;
}

export function priceCacheKey(
  productId: string,
  tier: CustomerTier,
  currency: Currency,
  qty: number
): string {
  return `catalog:price:${productId}:${tier}:${currency}:${qty}`;
}

export function enumeratePriceCacheKeys(productId: string): string[] {
  const keys: string[] = [];

  for (const tier of CUSTOMER_TIERS) {
    for (const currency of SUPPORTED_CURRENCIES) {
      for (let qty = PRICE_CACHE_QTY_MIN; qty <= PRICE_CACHE_QTY_MAX; qty += 1) {
        keys.push(priceCacheKey(productId, tier, currency, qty));
      }
    }
  }

  return keys;
}
