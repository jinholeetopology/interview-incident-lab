import type { NextFunction, Request, Response } from "express";
import type { InventoryDeps } from "../deps.js";
import { paginationSchema } from "./paginationSchemas.js";
import { requestContext } from "./requestContext.js";

export const listWarehouses = (deps: InventoryDeps) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = paginationSchema.parse(req.query);
    deps.logger.debug("warehouse list requested", { ...requestContext(req), ...query });
    const warehouses = await deps.warehouseService.list(query.limit, query.offset);
    res.json(warehouses);
  } catch (err) {
    next(err);
  }
};
