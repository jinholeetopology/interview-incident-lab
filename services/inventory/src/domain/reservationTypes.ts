import type { RequestedReservationLine } from "./allocationTypes.js";

export interface CreateReservationInput {
  orderId: string;
  lines: RequestedReservationLine[];
}
