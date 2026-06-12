import { describe, expect, it } from "vitest";
import { computeLocalUnitPrice } from "../src/domain/pricingEngine.js";
import { priceRule, product } from "./helpers.js";

describe("computeLocalUnitPrice", () => {
  it("applies the highest-priority active rule before tier pricing", () => {
    const result = computeLocalUnitPrice({
      product: product({ basePriceCents: 10_000 }),
      activeRules: [
        priceRule({ id: "low", ruleType: "fixed_off", value: 500, priority: 1 }),
        priceRule({ id: "high", ruleType: "percent_off", value: 1500, priority: 5 })
      ],
      customerTier: "standard"
    });

    expect(result).toEqual({
      unitPriceCents: 8500,
      appliedRuleIds: ["high"]
    });
  });

  it("applies tier multipliers after override rules", () => {
    const result = computeLocalUnitPrice({
      product: product({ basePriceCents: 10_000 }),
      activeRules: [priceRule({ id: "override", ruleType: "override", value: 999, priority: 5 })],
      customerTier: "gold"
    });

    expect(result.unitPriceCents).toBe(969);
    expect(result.appliedRuleIds).toEqual(["override"]);
  });

  it("uses the base product price when no rule is active", () => {
    const result = computeLocalUnitPrice({
      product: product({ basePriceCents: 12_345 }),
      activeRules: [],
      customerTier: "platinum"
    });

    expect(result).toEqual({
      unitPriceCents: 11_728,
      appliedRuleIds: []
    });
  });
});
