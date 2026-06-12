import type { RequestHandler } from "express";
import { cancelOrder } from "../domain/cancelOrder.js";
import { contextFromRequest } from "../requestContext.js";
import type { ControllerDeps } from "./controllerDeps.js";
import { runMaybeIdempotent } from "./idempotency.js";
import { parseParams } from "./parse.js";
import { orderIdParamsSchema } from "./schemas.js";

export const cancelOrderController = (deps: ControllerDeps): RequestHandler => {
  return async (req, res, next) => {
    try {
      const params = parseParams(orderIdParamsSchema, req);
      const order = await runMaybeIdempotent(
        deps.idempotency,
        req,
        "cancel",
        () => cancelOrder(deps.cancelOrder, params.id, contextFromRequest(req))
      );
      res.json(order);
    } catch (err) {
      next(err);
    }
  };
};
