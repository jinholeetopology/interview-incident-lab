import type { Db } from "@atlas/shared";
import type { PriceRule, PriceRuleCreateInput } from "../domain/types.js";
import { mapPriceRuleRow } from "./priceRuleMapper.js";
import type { PriceRuleRow } from "./repositoryTypes.js";

const PRICE_RULE_COLUMNS = `
  id, product_id, rule_type, value, priority, starts_at, ends_at, created_at
`;

export class PriceRuleRepository {
  constructor(private readonly db: Db) {}

  async findActiveByProduct(productId: string, asOf: Date): Promise<PriceRule[]> {
    const rows = await this.db.query<PriceRuleRow>(
      `select ${PRICE_RULE_COLUMNS}
       from price_rules
       where product_id = $1
         and starts_at <= $2
         and ends_at > $2
       order by priority desc, created_at desc, id desc`,
      [productId, asOf.toISOString()]
    );
    return rows.map(mapPriceRuleRow);
  }

  async findById(id: string): Promise<PriceRule | null> {
    const rows = await this.db.query<PriceRuleRow>(
      `select ${PRICE_RULE_COLUMNS} from price_rules where id = $1`,
      [id]
    );
    return rows[0] ? mapPriceRuleRow(rows[0]) : null;
  }

  async create(id: string, input: PriceRuleCreateInput): Promise<PriceRule> {
    const rows = await this.db.query<PriceRuleRow>(
      `insert into price_rules (
         id, product_id, rule_type, value, priority, starts_at, ends_at, created_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, now())
       returning ${PRICE_RULE_COLUMNS}`,
      [
        id,
        input.productId,
        input.ruleType,
        input.value,
        input.priority,
        input.startsAt,
        input.endsAt
      ]
    );
    return mapPriceRuleRow(rows[0]!);
  }

  async deleteById(id: string): Promise<PriceRule | null> {
    const rows = await this.db.query<PriceRuleRow>(
      `delete from price_rules where id = $1 returning ${PRICE_RULE_COLUMNS}`,
      [id]
    );
    return rows[0] ? mapPriceRuleRow(rows[0]) : null;
  }
}
