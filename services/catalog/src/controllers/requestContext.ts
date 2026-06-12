import type { Request } from "express";
import type { RequestContext } from "../clients/types.js";

export function requestContext(req: Request): RequestContext {
  const requestId = req.id ?? req.header("x-request-id");
  return requestId ? { requestId } : {};
}
