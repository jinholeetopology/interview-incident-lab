import { describe, expect, it } from "vitest";
import {
  enumeratePriceCacheKeys,
  priceCacheKey,
  PRICE_CACHE_QTY_MAX,
  PRICE_CACHE_QTY_MIN
} from "../src/domain/cacheKeys.js";

describe("price cache keys", () => {
  it("uses the contract key shape", () => {
    expect(priceCacheKey("p1", "gold", "KRW", 25)).toBe("catalog:price:p1:gold:KRW:25");
  });

  it("enumerates every accepted tier, currency, and quantity variant", () => {
    const keys = enumeratePriceCacheKeys("p1");

    expect(keys).toHaveLength(3 * 4 * (PRICE_CACHE_QTY_MAX - PRICE_CACHE_QTY_MIN + 1));
    expect(keys).toContain("catalog:price:p1:standard:USD:1");
    expect(keys).toContain("catalog:price:p1:platinum:EUR:1000");
  });
});
