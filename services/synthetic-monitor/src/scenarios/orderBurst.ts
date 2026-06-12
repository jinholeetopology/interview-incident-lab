import { alertOnHttpError } from "../invariants/http.js";
import { assertOrderTotals } from "../invariants/orders.js";
import { assertStockNonNegative } from "../invariants/stock.js";
import type { OrderResponse, Scenario } from "../types.js";

export const orderBurstScenario: Scenario = {
  name: "order-burst",
  async run(ctx) {
    const productId = ctx.fixtures.burstProductId;
    const customerIds = ctx.fixtures.customerIds.slice(0, 6);
    const orders = await Promise.all(
      customerIds.map((customerId) =>
        ctx.client.post<OrderResponse>("/api/orders/orders", {
          customerId,
          lines: [{ productId, qty: 1 }]
        })
      )
    );

    ctx.state.lastOrderIds = [];
    for (const order of orders) {
      if (alertOnHttpError(ctx.alerts, order)) {
        continue;
      }
      ctx.state.lastOrderIds.push(order.body.id);
      assertOrderTotals(ctx.alerts, order.body);
    }

    const stock = await ctx.client.get(`/api/inventory/stock/${productId}`);
    if (!alertOnHttpError(ctx.alerts, stock)) {
      assertStockNonNegative(ctx.alerts, stock.body as { productId: string; byWarehouse?: { warehouseId: string; onHand: number; reserved: number }[] });
    }
  }
};
