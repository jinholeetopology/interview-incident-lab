import type { AlertEmitter } from "../alerts.js";
import type { HttpResult } from "../types.js";

export const alertOnHttpError = (
  alerts: AlertEmitter,
  result: HttpResult,
  allowedStatuses: number[] = []
): boolean => {
  if (result.ok || allowedStatuses.includes(result.status)) {
    return false;
  }
  alerts.emit("http_error", { path: result.path, status: result.status });
  return true;
};
