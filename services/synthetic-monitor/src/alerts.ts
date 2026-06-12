import type { Logger } from "@atlas/shared";
import type { JsonObject } from "./types.js";

export type AlertKind =
  | "stock_negative"
  | "order_total_zero"
  | "stale_price"
  | "duplicate_charge"
  | "http_error";

export type AlertEmitter = {
  emit(kind: AlertKind, fields: JsonObject): void;
};

export const createAlertEmitter = (logger: Logger): AlertEmitter => ({
  emit(kind, fields) {
    logger.error(`ALERT ${kind} ${JSON.stringify(fields)}`, { kind, ...fields });
  }
});
