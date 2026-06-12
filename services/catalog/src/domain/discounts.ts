import type { PriceRule } from "./types.js";
import { multiplyCents } from "./rounding.js";

const BASIS_POINTS = 10_000;

export function applyPriceRule(basePriceCents: number, rule: PriceRule): number {
  if (rule.ruleType === "percent_off") {
    const remainingBasisPoints = Math.max(0, BASIS_POINTS - rule.value);
    return multiplyCents(basePriceCents, remainingBasisPoints / BASIS_POINTS);
  }

  if (rule.ruleType === "fixed_off") {
    return Math.max(0, basePriceCents - rule.value);
  }

  return rule.value;
}
