import { Router } from "express";
import type { CatalogServices } from "../deps.js";
import { createCategoryController } from "../controllers/categoryController.js";

export function createCategoriesRouter(services: CatalogServices): Router {
  const router = Router();
  const categories = createCategoryController(services.categories);

  router.get("/", categories.list);

  return router;
}
