import type { RequestHandler } from "express";
import { getOrderTimeline } from "../domain/readOrders.js";
import type { ControllerDeps } from "./controllerDeps.js";
import { parseParams } from "./parse.js";
import { orderIdParamsSchema } from "./schemas.js";

export const timelineController = (deps: ControllerDeps): RequestHandler => {
  return async (req, res, next) => {
    try {
      const params = parseParams(orderIdParamsSchema, req);
      const timeline = await getOrderTimeline(deps.readOrders, params.id);
      res.json(timeline);
    } catch (err) {
      next(err);
    }
  };
};
