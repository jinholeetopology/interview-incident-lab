import type { PriceRule, Product } from "../src/domain/types.js";

export function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "8a4a38cb-b0fd-44d8-b5c9-f3cb832984ed",
    sku: "SKU-100",
    name: "Test product",
    description: "A product for pricing tests",
    categoryId: "2449f6de-04d1-4398-bc38-c92f0b918b01",
    basePriceCents: 10_000,
    currency: "USD",
    status: "active",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides
  };
}

export function priceRule(overrides: Partial<PriceRule> = {}): PriceRule {
  return {
    id: "9fc5c8d6-674d-4ed6-a04a-1ccdf08a2295",
    productId: "8a4a38cb-b0fd-44d8-b5c9-f3cb832984ed",
    ruleType: "percent_off",
    value: 1000,
    priority: 10,
    startsAt: "2026-06-01T00:00:00.000Z",
    endsAt: "2026-07-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides
  };
}
