import type { RequestHandler } from "express";
import { contextFromRequest } from "../requestContext.js";
import { placeOrder } from "../domain/placeOrder.js";
import type { ControllerDeps } from "./controllerDeps.js";
import { runMaybeIdempotent } from "./idempotency.js";
import { parseBody } from "./parse.js";
import { createOrderSchema } from "./schemas.js";

export const createOrderController = (deps: ControllerDeps): RequestHandler => {
  return async (req, res, next) => {
    try {
      const body = parseBody(createOrderSchema, req);
      const result = await runMaybeIdempotent(
        deps.idempotency,
        req,
        "create",
        () => placeOrder(deps.placeOrder, body, contextFromRequest(req))
      );

      res.status(201).json(result.order);
    } catch (err) {
      next(err);
    }
  };
};
