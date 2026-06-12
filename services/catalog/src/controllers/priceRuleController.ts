import type { RequestHandler } from "express";
import type { PriceRuleService } from "../domain/priceRuleService.js";
import type { PriceRuleCreateInput } from "../domain/types.js";
import { asyncHandler } from "./asyncHandler.js";
import { createPriceRuleBodySchema, priceRuleIdParamSchema } from "./priceRuleSchemas.js";
import { parseWithSchema } from "./validation.js";

export interface PriceRuleController {
  create: RequestHandler;
  remove: RequestHandler;
}

export function createPriceRuleController(priceRules: PriceRuleService): PriceRuleController {
  return {
    create: asyncHandler(async (req, res) => {
      const body = parseWithSchema(createPriceRuleBodySchema, req.body, "body") as PriceRuleCreateInput;
      const rule = await priceRules.createPriceRule(body);
      res.status(201).json(rule);
    }),

    remove: asyncHandler(async (req, res) => {
      const params = parseWithSchema(priceRuleIdParamSchema, req.params, "params");
      await priceRules.deletePriceRule(params.id);
      res.status(204).send();
    })
  };
}
