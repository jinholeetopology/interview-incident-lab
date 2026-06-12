import type { RequestHandler } from "express";
import { getOrder } from "../domain/readOrders.js";
import type { ControllerDeps } from "./controllerDeps.js";
import { parseParams } from "./parse.js";
import { orderIdParamsSchema } from "./schemas.js";

export const getOrderController = (deps: ControllerDeps): RequestHandler => {
  return async (req, res, next) => {
    try {
      const params = parseParams(orderIdParamsSchema, req);
      const order = await getOrder(deps.readOrders, params.id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  };
};
