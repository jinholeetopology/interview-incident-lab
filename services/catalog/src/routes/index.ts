import { Router } from "express";
import type { CatalogServices } from "../deps.js";
import { createCategoriesRouter } from "./categories.js";
import { createPriceRulesRouter } from "./priceRules.js";
import { createProductsRouter } from "./products.js";

export function createCatalogRouter(services: CatalogServices): Router {
  const router = Router();

  router.use("/products", createProductsRouter(services));
  router.use("/categories", createCategoriesRouter(services));
  router.use("/price-rules", createPriceRulesRouter(services));

  return router;
}
