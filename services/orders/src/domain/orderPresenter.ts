import type { Order, Shipment } from "./models.js";

export interface OrderResponse extends Order {
  shipment?: Shipment | null;
}

export const presentOrder = (
  order: Order,
  shipment?: Shipment | null
): OrderResponse => {
  const response: OrderResponse = { ...order };
  if (shipment !== undefined) {
    response.shipment = shipment;
  }
  return response;
};
