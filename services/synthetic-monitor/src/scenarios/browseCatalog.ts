import { alertOnHttpError } from "../invariants/http.js";
import { fixtureAt } from "../fixtures/selectors.js";
import type { ListResponse, ProductSummary, Scenario } from "../types.js";

export const browseCatalogScenario: Scenario = {
  name: "browse-catalog",
  async run(ctx) {
    const products = await ctx.client.get<ListResponse<ProductSummary>>(
      "/api/catalog/products?limit=12&offset=0&status=active"
    );
    if (alertOnHttpError(ctx.alerts, products)) {
      return;
    }

    ctx.state.lastProductIds = products.body.items.map((product) => product.id);
    const stockProductId = fixtureAt(ctx.fixtures.activeProductIds, 0, "activeProductIds");
    await Promise.all([
      ctx.client.get("/api/catalog/categories").then((result) => alertOnHttpError(ctx.alerts, result)),
      ctx.client
        .get(`/api/inventory/stock/${stockProductId}`)
        .then((result) => alertOnHttpError(ctx.alerts, result))
    ]);
  }
};
