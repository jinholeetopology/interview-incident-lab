import type { CustomerTier, PriceRule, Product } from "./types.js";
import { applyPriceRule } from "./discounts.js";
import { selectWinningRule } from "./ruleSelection.js";
import { applyTierMultiplier } from "./tiers.js";

export interface LocalPriceInput {
  product: Product;
  activeRules: PriceRule[];
  customerTier: CustomerTier;
}

export interface LocalPriceResult {
  unitPriceCents: number;
  appliedRuleIds: string[];
}

export function computeLocalUnitPrice(input: LocalPriceInput): LocalPriceResult {
  const winningRule = selectWinningRule(input.activeRules);
  const ruleAdjustedPrice = winningRule
    ? applyPriceRule(input.product.basePriceCents, winningRule)
    : input.product.basePriceCents;

  return {
    unitPriceCents: applyTierMultiplier(ruleAdjustedPrice, input.customerTier),
    appliedRuleIds: winningRule ? [winningRule.id] : []
  };
}
