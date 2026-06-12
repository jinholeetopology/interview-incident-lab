import { fixtureAt } from "../fixtures/selectors.js";
import { alertOnHttpError } from "../invariants/http.js";
import type { PriceQuote, Scenario } from "../types.js";

export const priceLookupScenario: Scenario = {
  name: "price-lookup",
  async run(ctx) {
    const productId = ctx.state.lastProductIds[0] ?? fixtureAt(ctx.fixtures.activeProductIds, 1, "activeProductIds");
    const quote = await ctx.client.get<PriceQuote>(
      `/api/catalog/products/${productId}/price?customerTier=gold&currency=USD&qty=12`
    );
    if (alertOnHttpError(ctx.alerts, quote)) {
      return;
    }

    if (quote.body.unitPriceCents <= 0) {
      ctx.alerts.emit("order_total_zero", {
        orderId: `price:${productId}`,
        currency: quote.body.currency
      });
    }
  }
};
