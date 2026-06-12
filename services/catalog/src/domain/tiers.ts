import type { CustomerTier } from "./types.js";
import { multiplyCents } from "./rounding.js";

export const TIER_MULTIPLIERS: Record<CustomerTier, number> = {
  standard: 1,
  gold: 0.97,
  platinum: 0.95
};

export function applyTierMultiplier(amountCents: number, tier: CustomerTier): number {
  return multiplyCents(amountCents, TIER_MULTIPLIERS[tier]);
}
