import type { Idempotency } from "@atlas/shared";
import type { Request } from "express";
import { requestIdempotencyKey } from "../domain/idempotencyKeys.js";

export const runMaybeIdempotent = async <T>(
  idempotency: Idempotency,
  req: Request,
  operation: "create" | "cancel" | "ship",
  fn: () => Promise<T>
): Promise<T> => {
  const rawKey = req.header("idempotency-key");
  if (!rawKey) {
    return fn();
  }

  const { result } = await idempotency.run(
    requestIdempotencyKey(operation, rawKey),
    24 * 60 * 60,
    fn
  );
  return result;
};
