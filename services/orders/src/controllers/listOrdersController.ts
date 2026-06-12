import type { RequestHandler } from "express";
import { listOrders } from "../domain/readOrders.js";
import type { OrderListFilter } from "../repositories/orderRepository.js";
import type { ControllerDeps } from "./controllerDeps.js";
import { parseQuery } from "./parse.js";
import { listOrdersQuerySchema } from "./schemas.js";

export const listOrdersController = (deps: ControllerDeps): RequestHandler => {
  return async (req, res, next) => {
    try {
      const query = parseQuery(listOrdersQuerySchema, req);
      const filter: OrderListFilter = {};
      if (query.customerId) {
        filter.customerId = query.customerId;
      }
      if (query.status) {
        filter.status = query.status;
      }

      const result = await listOrders(
        deps.readOrders,
        filter,
        {
          limit: query.limit,
          offset: query.offset
        }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
};
