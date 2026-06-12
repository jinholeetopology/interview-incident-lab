import { describe, expect, it, vi } from "vitest";
import { placeOrder } from "../src/domain/placeOrder.js";
import { makePlaceOrderDeps } from "./fixtures.js";

describe("placeOrder", () => {
  it("prices, reserves, captures, commits, and confirms the order", async () => {
    const deps = makePlaceOrderDeps();

    const result = await placeOrder(
      deps,
      {
        customerId: "11111111-1111-4111-8111-111111111111",
        lines: [{ productId: "22222222-2222-4222-8222-222222222222", qty: 2 }]
      },
      { requestId: "req-1" }
    );

    expect(result.order.status).toBe("confirmed");
    expect(deps.catalog.getProduct).toHaveBeenCalledWith(
      "22222222-2222-4222-8222-222222222222",
      expect.objectContaining({ requestId: "req-1" })
    );
    expect(deps.inventory.createReservation).toHaveBeenCalledWith(
      {
        orderId: expect.any(String),
        lines: [{ productId: "22222222-2222-4222-8222-222222222222", qty: 2 }]
      },
      expect.objectContaining({ requestId: "req-1" })
    );
    expect(deps.payments.createIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 2400,
        currency: "USD",
        idempotencyKey: expect.stringMatching(/^order:/)
      }),
      expect.objectContaining({ requestId: "req-1" })
    );
    expect(deps.payments.captureIntent).toHaveBeenCalledWith(
      "payment-intent-1",
      expect.objectContaining({ idempotencyKey: expect.stringMatching(/^order:/) }),
      expect.any(Object)
    );
    expect(deps.inventory.commitReservation).toHaveBeenCalledWith(
      "reservation-1",
      expect.objectContaining({ requestId: "req-1" })
    );
    expect(deps.orders.markConfirmed).toHaveBeenCalledTimes(1);
    expect(deps.inventory.releaseReservation).not.toHaveBeenCalled();
    expect(deps.payments.voidIntent).not.toHaveBeenCalled();
  });

  it("rejects duplicate product lines before creating an order", async () => {
    const deps = makePlaceOrderDeps();

    await expect(
      placeOrder(
        deps,
        {
          customerId: "11111111-1111-4111-8111-111111111111",
          lines: [
            { productId: "22222222-2222-4222-8222-222222222222", qty: 1 },
            { productId: "22222222-2222-4222-8222-222222222222", qty: 1 }
          ]
        },
        { requestId: "req-1" }
      )
    ).rejects.toMatchObject({ code: "DUPLICATE_ORDER_LINE" });

    expect(deps.orders.createPending).not.toHaveBeenCalled();
    expect(vi.mocked(deps.inventory.createReservation)).not.toHaveBeenCalled();
  });
});
