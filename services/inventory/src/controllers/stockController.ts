import type { NextFunction, Request, Response } from "express";
import type { InventoryDeps } from "../deps.js";
import { requestContext } from "./requestContext.js";
import { productIdParamsSchema } from "./stockSchemas.js";
import { stockResponse } from "./responseMappers.js";
import { parseRequest } from "./validation.js";

export const getStock = (deps: InventoryDeps) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params = parseRequest(productIdParamsSchema, req.params);
    deps.logger.debug("stock lookup", { ...requestContext(req), productId: params.productId });
    const stock = await deps.stockService.getProductStock(params.productId);
    res.json(stockResponse(stock));
  } catch (err) {
    next(err);
  }
};
