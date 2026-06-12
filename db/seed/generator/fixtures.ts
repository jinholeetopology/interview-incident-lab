import type { SeedData } from "./types.js";

export const createFixtureDocument = (data: SeedData) => ({
  generatedAt: "2026-01-01T00:00:00.000Z",
  productIds: data.products.slice(0, 24).map((product) => product.id),
  activeProductIds: data.products.filter((product) => product.status === "active").slice(0, 24).map((product) => product.id),
  customerIds: data.customers.slice(0, 16).map((customer) => customer.id),
  warehouseIds: data.warehouses.map((warehouse) => warehouse.id),
  priceRuleProductId: requireSeedValue(data.products[10]?.id, "priceRuleProductId"),
  burstProductId: requireSeedValue(data.products[11]?.id, "burstProductId")
});

const requireSeedValue = (value: string | undefined, label: string): string => {
  if (value === undefined) {
    throw new Error(`Missing fixture value: ${label}`);
  }
  return value;
};
