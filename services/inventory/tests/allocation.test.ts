import { describe, expect, it } from "vitest";
import { planAllocations } from "../src/domain/allocation.js";

describe("planAllocations", () => {
  it("prefers the warehouse with the most available stock", () => {
    const result = planAllocations("product-a", 6, [
      { productId: "product-a", warehouseId: "warehouse-1", available: 4 },
      { productId: "product-a", warehouseId: "warehouse-2", available: 9 },
      { productId: "product-a", warehouseId: "warehouse-3", available: 7 }
    ]);

    expect(result).toEqual([
      { productId: "product-a", warehouseId: "warehouse-2", qty: 6 }
    ]);
  });

  it("splits a line when no single warehouse can satisfy it", () => {
    const result = planAllocations("product-a", 10, [
      { productId: "product-a", warehouseId: "warehouse-1", available: 4 },
      { productId: "product-a", warehouseId: "warehouse-2", available: 8 },
      { productId: "product-a", warehouseId: "warehouse-3", available: 5 }
    ]);

    expect(result).toEqual([
      { productId: "product-a", warehouseId: "warehouse-2", qty: 8 },
      { productId: "product-a", warehouseId: "warehouse-3", qty: 2 }
    ]);
  });

  it("throws when aggregate availability is short", () => {
    expect(() =>
      planAllocations("product-a", 10, [
        { productId: "product-a", warehouseId: "warehouse-1", available: 4 },
        { productId: "product-a", warehouseId: "warehouse-2", available: 3 }
      ])
    ).toThrow("Insufficient stock");
  });
});
