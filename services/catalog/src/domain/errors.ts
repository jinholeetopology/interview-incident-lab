import { AppError } from "@atlas/shared";

export function catalogError(
  code: string,
  status: number,
  message: string,
  ctx?: Record<string, unknown>
): AppError {
  return new AppError(code, status, message, ctx);
}

export function validationError(message: string, ctx?: Record<string, unknown>): AppError {
  return catalogError("VALIDATION_ERROR", 400, message, ctx);
}

export function notFoundError(resource: string, ctx?: Record<string, unknown>): AppError {
  return catalogError(`${resource.toUpperCase()}_NOT_FOUND`, 404, `${resource} not found`, ctx);
}

export function conflictError(message: string, ctx?: Record<string, unknown>): AppError {
  return catalogError("CONFLICT", 409, message, ctx);
}
