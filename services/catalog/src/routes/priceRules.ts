import { Router } from "express";
import type { CatalogServices } from "../deps.js";
import { createPriceRuleController } from "../controllers/priceRuleController.js";

export function createPriceRulesRouter(services: CatalogServices): Router {
  const router = Router();
  const priceRules = createPriceRuleController(services.priceRules);

  router.post("/", priceRules.create);
  router.delete("/:id", priceRules.remove);

  return router;
}
