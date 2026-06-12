import { Router } from "express";
import type { CatalogServices } from "../deps.js";
import { createPriceController } from "../controllers/priceController.js";
import { createProductController } from "../controllers/productController.js";

export function createProductsRouter(services: CatalogServices): Router {
  const router = Router();
  const products = createProductController(services.products);
  const prices = createPriceController(services.prices);

  router.get("/", products.list);
  router.post("/", products.create);
  router.get("/:id/price", prices.get);
  router.get("/:id", products.get);
  router.patch("/:id", products.patch);

  return router;
}
