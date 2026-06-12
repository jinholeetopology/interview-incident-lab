import { describe, expect, it, vi } from "vitest";
import type { Cache } from "@atlas/shared";
import { PriceRuleService } from "../src/domain/priceRuleService.js";
import { PRICE_CACHE_QTY_MAX, PRICE_CACHE_QTY_MIN } from "../src/domain/cacheKeys.js";
import type { ProductRepository } from "../src/repositories/productRepository.js";
import type { PriceRuleRepository } from "../src/repositories/priceRuleRepository.js";
import { priceRule, product } from "./helpers.js";

const ruleInput = {
  productId: product().id,
  ruleType: "override" as const,
  value: 12345,
  priority: 999,
  startsAt: "2026-06-01T00:00:00.000Z",
  endsAt: "2026-07-01T00:00:00.000Z"
};

const makeCache = (): Cache =>
  ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(async () => undefined),
    withCache: vi.fn(),
    close: vi.fn()
  }) as unknown as Cache;

const deletedKeys = (cache: Cache): string[] =>
  vi.mocked(cache.del).mock.calls.flatMap((call) => call);

describe("PriceRuleService", () => {
  it("invalidates price caches before and after creating a price rule", async () => {
    const cache = makeCache();
    const products = {
      findById: vi.fn(async () => product())
    } as unknown as ProductRepository;
    const priceRules = {
      create: vi.fn(async (_id: string) => priceRule({ ...ruleInput }))
    } as unknown as PriceRuleRepository;

    await new PriceRuleService(products, priceRules, cache).createPriceRule(ruleInput);

    const expectedKeyCountPerInvalidation = 3 * 4 * (PRICE_CACHE_QTY_MAX - PRICE_CACHE_QTY_MIN + 1);
    const keys = deletedKeys(cache);
    expect(keys).toHaveLength(expectedKeyCountPerInvalidation * 2);
    expect(keys).toContain(`catalog:price:${ruleInput.productId}:standard:USD:1`);
    expect(keys).toContain(`catalog:price:${ruleInput.productId}:platinum:EUR:1000`);
    expect(priceRules.create).toHaveBeenCalledTimes(1);
  });

  it("does not invalidate caches when the product does not exist", async () => {
    const cache = makeCache();
    const products = {
      findById: vi.fn(async () => null)
    } as unknown as ProductRepository;
    const priceRules = {
      create: vi.fn()
    } as unknown as PriceRuleRepository;

    await expect(
      new PriceRuleService(products, priceRules, cache).createPriceRule(ruleInput)
    ).rejects.toMatchObject({ code: "PRODUCT_NOT_FOUND" });

    expect(cache.del).not.toHaveBeenCalled();
    expect(priceRules.create).not.toHaveBeenCalled();
  });

  it("invalidates price caches before and after deleting a price rule", async () => {
    const cache = makeCache();
    const existingRule = priceRule(ruleInput);
    const products = {} as ProductRepository;
    const priceRules = {
      findById: vi.fn(async () => existingRule),
      deleteById: vi.fn(async () => existingRule)
    } as unknown as PriceRuleRepository;

    await new PriceRuleService(products, priceRules, cache).deletePriceRule(existingRule.id);

    const expectedKeyCountPerInvalidation = 3 * 4 * (PRICE_CACHE_QTY_MAX - PRICE_CACHE_QTY_MIN + 1);
    expect(deletedKeys(cache)).toHaveLength(expectedKeyCountPerInvalidation * 2);
    expect(priceRules.deleteById).toHaveBeenCalledWith(existingRule.id);
  });
});
