import { UpstreamError, type Logger } from "@atlas/shared";
import { upstreamOrderError } from "../domain/errors.js";
import type { RequestContext } from "../requestContext.js";

export const isUpstreamError = (err: unknown): err is UpstreamError =>
  err instanceof UpstreamError ||
  (typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "body" in err &&
    (err as { name?: unknown }).name === "UpstreamError");

export const logAndMapUpstream = (
  err: UpstreamError,
  logger: Logger,
  service: string,
  operation: string,
  ctx: RequestContext,
  code: string
): Error => {
  logger.warn(`${service} ${operation} failed`, {
    ...ctx,
    status: err.status,
    body: err.body
  });

  return upstreamOrderError(code, `${service} ${operation} failed`, {
    ...ctx,
    upstreamStatus: err.status
  });
};
