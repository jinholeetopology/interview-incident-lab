import type { AdjustmentResult, ReservationResult, StockSnapshot } from "../domain/resultTypes.js";

export const stockResponse = (stock: StockSnapshot): StockSnapshot => stock;

export const reservationResponse = (reservation: ReservationResult): ReservationResult => reservation;

export const adjustmentResponse = (adjustment: AdjustmentResult): AdjustmentResult => adjustment;
