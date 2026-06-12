import { fixtureAt } from "../fixtures/selectors.js";
import { alertOnHttpError } from "../invariants/http.js";
import { assertOrderTotals } from "../invariants/orders.js";
import type { OrderResponse, Scenario } from "../types.js";

export const cancellationScenario: Scenario = {
  name: "cancellations",
  async run(ctx) {
    const productId = fixtureAt(ctx.fixtures.activeProductIds, 2, "activeProductIds");
    const customerIndex = ctx.state.nextCustomerIndex % ctx.fixtures.customerIds.length;
    const customerId = fixtureAt(ctx.fixtures.customerIds, customerIndex, "customerIds");
    ctx.state.nextCustomerIndex += 1;

    const order = await ctx.client.post<OrderResponse>("/api/orders/orders", {
      customerId,
      lines: [{ productId, qty: 2 }]
    });
    if (alertOnHttpError(ctx.alerts, order)) {
      return;
    }
    assertOrderTotals(ctx.alerts, order.body);

    const cancelled = await ctx.client.post<OrderResponse>(`/api/orders/${order.body.id}/cancel`, {});
    alertOnHttpError(ctx.alerts, cancelled, [409, 422]);
  }
};
