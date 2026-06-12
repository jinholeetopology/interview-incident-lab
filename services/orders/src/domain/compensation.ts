import type { Logger } from "@atlas/shared";
import type { InventoryClient } from "../clients/inventoryClient.js";
import type { PaymentsClient } from "../clients/paymentsClient.js";
import type { CompensationState } from "./placeOrderTypes.js";

export interface CompensationDeps {
  inventory: InventoryClient;
  payments: PaymentsClient;
  logger: Logger;
}

export const compensateOrderFailure = async (
  deps: CompensationDeps,
  state: CompensationState
): Promise<void> => {
  if (state.reservationId) {
    deps.logger.warn("releasing reservation during order compensation", {
      ...state.ctx,
      orderId: state.orderId,
      reservationId: state.reservationId
    });
    await deps.inventory.releaseReservation(state.reservationId, state.ctx);
  }

  if (state.paymentIntentId) {
    deps.logger.warn("voiding payment intent during order compensation", {
      ...state.ctx,
      orderId: state.orderId,
      paymentIntentId: state.paymentIntentId
    });
    await deps.payments.voidIntent(state.paymentIntentId, state.ctx);
  }
};
