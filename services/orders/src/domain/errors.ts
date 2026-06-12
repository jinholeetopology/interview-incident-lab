import { AppError } from "@atlas/shared";

type AppErrorConstructor = new (
  code: string,
  status: number,
  message: string,
  ctx?: object
) => AppError;

const AppErrorClass = AppError as unknown as AppErrorConstructor;

export const orderError = (
  code: string,
  message: string,
  status: number,
  ctx?: object
): AppError => new AppErrorClass(code, status, message, ctx);

export const orderValidationError = (
  code: string,
  message: string,
  ctx?: object
): AppError => orderError(code, message, 422, ctx);

export const orderNotFoundError = (orderId: string): AppError =>
  orderError("ORDER_NOT_FOUND", "Order was not found", 404, { orderId });

export const orderConflictError = (
  code: string,
  message: string,
  ctx?: object
): AppError => orderError(code, message, 409, ctx);

export const upstreamOrderError = (
  code: string,
  message: string,
  ctx?: object
): AppError => orderError(code, message, 502, ctx);

export const insufficientStockError = (
  orderId: string,
  ctx?: object
): AppError =>
  orderValidationError("INSUFFICIENT_STOCK", "Insufficient stock for order", {
    orderId,
    ...ctx
  });

export const isErrorCode = (err: unknown, code: string): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code?: unknown }).code === code;
