import type { ReservationLineRow, ReservationRow } from "../repositories/repositoryTypes.js";
import type { ReservationResult } from "./resultTypes.js";

export const reservationResult = (
  reservation: ReservationRow,
  lines: ReservationLineRow[]
): ReservationResult => ({
  id: reservation.id,
  status: reservation.status,
  lines: lines.map((line) => ({
    productId: line.productId,
    warehouseId: line.warehouseId,
    qty: line.qty
  }))
});
