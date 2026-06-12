import type { Request } from "express";

export interface RequestContext {
  requestId?: string;
  orderId?: string;
  customerId?: string;
  productId?: string;
  reservationId?: string;
  paymentIntentId?: string;
  shipmentId?: string;
}

export const contextFromRequest = (req: Request): RequestContext => {
  const requestId = req.id ?? req.header("x-request-id");
  return requestId ? { requestId } : {};
};

export const withContext = (
  ctx: RequestContext,
  next: Omit<RequestContext, "requestId">
): RequestContext => ({
  ...ctx,
  ...next
});
