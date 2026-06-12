import type { NextFunction, Request, Response } from "express";
import type { InventoryDeps } from "../deps.js";
import { createAdjustmentBodySchema } from "./adjustmentSchemas.js";
import { adjustmentResponse } from "./responseMappers.js";
import { requestContext } from "./requestContext.js";
import { parseRequest } from "./validation.js";

export const createAdjustment = (deps: InventoryDeps) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = parseRequest(createAdjustmentBodySchema, req.body);
    deps.logger.info("stock adjustment requested", {
      ...requestContext(req),
      warehouseId: body.warehouseId,
      productId: body.productId,
      delta: body.delta
    });
    const adjustment = await deps.adjustmentService.adjust(body);
    res.status(201).json(adjustmentResponse(adjustment));
  } catch (err) {
    next(err);
  }
};
