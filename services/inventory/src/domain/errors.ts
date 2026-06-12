import { AppError } from "@atlas/shared";

export const insufficientStock = (ctx?: object): AppError =>
  new AppError("INSUFFICIENT_STOCK", 409, "Insufficient stock", ctx);

export const reservationNotFound = (reservationId: string): AppError =>
  new AppError("RESERVATION_NOT_FOUND", 404, "Reservation not found", { reservationId });

export const stockLevelNotFound = (warehouseId: string, productId: string): AppError =>
  new AppError("STOCK_LEVEL_NOT_FOUND", 404, "Stock level not found", { warehouseId, productId });

export const stockAdjustmentWouldGoNegative = (
  warehouseId: string,
  productId: string
): AppError =>
  new AppError("STOCK_ADJUSTMENT_NEGATIVE", 409, "Adjustment would make stock negative", {
    warehouseId,
    productId
  });

export const reservationAlreadyReleased = (reservationId: string): AppError =>
  new AppError("RESERVATION_ALREADY_RELEASED", 409, "Reservation has already been released", {
    reservationId
  });

export const reservationAlreadyCommitted = (reservationId: string): AppError =>
  new AppError("RESERVATION_ALREADY_COMMITTED", 409, "Reservation has already been committed", {
    reservationId
  });

export const emptyReservation = (): AppError =>
  new AppError("EMPTY_RESERVATION", 400, "Reservation requires at least one line");
