import type { RequestHandler } from "express";
import type { Currency } from "../domain/currency.js";
import type { PriceService } from "../domain/priceService.js";
import type { PriceRequest } from "../domain/types.js";
import { asyncHandler } from "./asyncHandler.js";
import { priceQuerySchema, productIdParamSchema } from "./productSchemas.js";
import { requestContext } from "./requestContext.js";
import { parseWithSchema } from "./validation.js";

export interface PriceController {
  get: RequestHandler;
}

export function createPriceController(prices: PriceService): PriceController {
  return {
    get: asyncHandler(async (req, res) => {
      const params = parseWithSchema(productIdParamSchema, req.params, "params");
      const query = parseWithSchema(priceQuerySchema, req.query, "query");
      const priceRequest: PriceRequest = {
        productId: params.id,
        customerTier: query.customerTier ?? "standard",
        qty: query.qty ?? 1
      };
      if (query.currency) {
        priceRequest.currency = query.currency as Currency;
      }
      const ctx = requestContext(req);
      if (ctx.requestId) {
        priceRequest.requestId = ctx.requestId;
      }

      res.json(await prices.getPrice(priceRequest));
    })
  };
}
