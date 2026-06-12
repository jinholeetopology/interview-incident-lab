import { toIsoString } from "../domain/time.js";
import type { PriceRule, PriceRuleType } from "../domain/types.js";
import type { PriceRuleRow } from "./repositoryTypes.js";

export function mapPriceRuleRow(row: PriceRuleRow): PriceRule {
  return {
    id: row.id,
    productId: row.product_id,
    ruleType: row.rule_type as PriceRuleType,
    value: Number(row.value),
    priority: row.priority,
    startsAt: toIsoString(row.starts_at),
    endsAt: toIsoString(row.ends_at),
    createdAt: toIsoString(row.created_at)
  };
}
