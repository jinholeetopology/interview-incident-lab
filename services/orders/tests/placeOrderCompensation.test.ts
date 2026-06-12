import { describe, expect, it, vi } from "vitest";
import { insufficientStockError, upstreamOrderError } from "../src/domain/errors.js";
import { placeOrder } from "../src/domain/placeOrder.js";
import { makePlaceOrderDeps } from "./fixtures.js";

const input = {
  customerId: "11111111-1111-4111-8111-111111111111",
  lines: [{ productId: "22222222-2222-4222-8222-222222222222", qty: 2 }]
};

describe("placeOrder compensation", () => {
  it("marks the order failed without compensation when stock is insufficient", async () => {
    const deps = makePlaceOrderDeps();
    vi.mocked(deps.inventory.createReservation).mockRejectedValueOnce(
      insufficientStockError("order-1")
    );

    await expect(placeOrder(deps, input, { requestId: "req-1" })).rejects.toMatchObject({
      code: "INSUFFICIENT_STOCK"
    });

    expect(deps.orders.markFailed).toHaveBeenCalledTimes(1);
    expect(deps.inventory.releaseReservation).not.toHaveBeenCalled();
    expect(deps.payments.voidIntent).not.toHaveBeenCalled();
  });

  it("releases a reservation when payment intent creation fails", async () => {
    const deps = makePlaceOrderDeps();
    vi.mocked(deps.payments.createIntent).mockRejectedValueOnce(
      upstreamOrderError("PAYMENT_INTENT_UPSTREAM_ERROR", "payments failed")
    );

    await expect(placeOrder(deps, input, { requestId: "req-1" })).rejects.toMatchObject({
      code: "PAYMENT_INTENT_UPSTREAM_ERROR"
    });

    expect(deps.inventory.releaseReservation).toHaveBeenCalledWith(
      "reservation-1",
      expect.objectContaining({ requestId: "req-1" })
    );
    expect(deps.payments.voidIntent).not.toHaveBeenCalled();
    expect(deps.orders.markFailed).toHaveBeenCalledTimes(1);
  });

  it("releases the reservation and voids the intent when capture fails", async () => {
    const deps = makePlaceOrderDeps();
    vi.mocked(deps.payments.captureIntent).mockRejectedValueOnce(
      upstreamOrderError("PAYMENT_CAPTURE_UPSTREAM_ERROR", "capture failed")
    );

    await expect(placeOrder(deps, input, { requestId: "req-1" })).rejects.toMatchObject({
      code: "PAYMENT_CAPTURE_UPSTREAM_ERROR"
    });

    expect(deps.inventory.releaseReservation).toHaveBeenCalledWith(
      "reservation-1",
      expect.any(Object)
    );
    expect(deps.payments.voidIntent).toHaveBeenCalledWith(
      "payment-intent-1",
      expect.any(Object)
    );
    expect(deps.orders.markFailed).toHaveBeenCalledTimes(1);
  });

  it("releases the reservation and voids the intent when reservation commit fails", async () => {
    const deps = makePlaceOrderDeps();
    vi.mocked(deps.inventory.commitReservation).mockRejectedValueOnce(
      upstreamOrderError("INVENTORY_COMMIT_UPSTREAM_ERROR", "commit failed")
    );

    await expect(placeOrder(deps, input, { requestId: "req-1" })).rejects.toMatchObject({
      code: "INVENTORY_COMMIT_UPSTREAM_ERROR"
    });

    expect(deps.inventory.releaseReservation).toHaveBeenCalledWith(
      "reservation-1",
      expect.any(Object)
    );
    expect(deps.payments.voidIntent).toHaveBeenCalledWith(
      "payment-intent-1",
      expect.any(Object)
    );
    expect(deps.orders.markFailed).toHaveBeenCalledTimes(1);
  });
});
