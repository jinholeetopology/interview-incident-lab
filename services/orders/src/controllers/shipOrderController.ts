import type { RequestHandler } from "express";
import { shipOrder } from "../domain/shipOrder.js";
import { contextFromRequest } from "../requestContext.js";
import type { ControllerDeps } from "./controllerDeps.js";
import { runMaybeIdempotent } from "./idempotency.js";
import { parseBody, parseParams } from "./parse.js";
import { orderIdParamsSchema, shipOrderSchema } from "./schemas.js";

export const shipOrderController = (deps: ControllerDeps): RequestHandler => {
  return async (req, res, next) => {
    try {
      const params = parseParams(orderIdParamsSchema, req);
      const body = parseBody(shipOrderSchema, req);
      const result = await runMaybeIdempotent(
        deps.idempotency,
        req,
        "ship",
        () => shipOrder(deps.shipOrder, params.id, body, contextFromRequest(req))
      );
      res.status(201).json(result.shipment);
    } catch (err) {
      next(err);
    }
  };
};
