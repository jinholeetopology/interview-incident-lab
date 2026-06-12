import type { Idempotency } from "@atlas/shared";
import type { CancelOrderDeps } from "../domain/cancelOrder.js";
import type { PlaceOrderDeps } from "../domain/placeOrderTypes.js";
import type { ReadOrderDeps } from "../domain/readOrders.js";
import type { ShipOrderDeps } from "../domain/shipOrder.js";

export interface ControllerDeps {
  idempotency: Idempotency;
  placeOrder: PlaceOrderDeps;
  cancelOrder: CancelOrderDeps;
  shipOrder: ShipOrderDeps;
  readOrders: ReadOrderDeps;
}
