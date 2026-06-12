import { deterministicUuid } from "../runtime/deterministic.js";
import { alertOnHttpError } from "../invariants/http.js";
import { assertPrice } from "../invariants/pricing.js";
import type { PriceQuote, Scenario } from "../types.js";

type PriceRuleResponse = {
  id?: string;
};

const overrideCents = 12_345;

export const priceRuleMutationScenario: Scenario = {
  name: "price-rule-mutation",
  async run(ctx) {
    const productId = ctx.fixtures.priceRuleProductId;
    const requestId = deterministicUuid(`price-rule-${ctx.state.cycle}`);
    const created = await ctx.client.post<PriceRuleResponse>("/api/catalog/price-rules", {
      requestId,
      productId,
      ruleType: "override",
      value: overrideCents,
      priority: 999,
      startsAt: "2025-01-01T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z"
    });
    if (alertOnHttpError(ctx.alerts, created)) {
      return;
    }

    const quote = await ctx.client.get<PriceQuote>(
      `/api/catalog/products/${productId}/price?customerTier=platinum&currency=USD&qty=4`
    );
    if (!alertOnHttpError(ctx.alerts, quote)) {
      assertPrice(ctx.alerts, quote.body, overrideCents);
    }

    if (created.body.id) {
      const deleted = await ctx.client.delete(`/api/catalog/price-rules/${created.body.id}`);
      alertOnHttpError(ctx.alerts, deleted, [404]);
    }
  }
};
