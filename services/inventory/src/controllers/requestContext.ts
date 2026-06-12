import type { Request } from "express";
import type { RequestWithId } from "./controllerTypes.js";

export const requestContext = (req: Request): { requestId?: string } => {
  const requestId = (req as RequestWithId).id ?? req.header("x-request-id") ?? undefined;
  return requestId ? { requestId } : {};
};
