import type { RequestHandler } from "express";
import type { CategoryService } from "../domain/categoryService.js";
import { asyncHandler } from "./asyncHandler.js";
import { paginationQuerySchema } from "./pagination.js";
import { parseWithSchema } from "./validation.js";

export interface CategoryController {
  list: RequestHandler;
}

export function createCategoryController(categories: CategoryService): CategoryController {
  return {
    list: asyncHandler(async (req, res) => {
      const pagination = parseWithSchema(paginationQuerySchema, req.query, "query");
      res.json(await categories.listCategories({ limit: pagination.limit ?? 50, offset: pagination.offset ?? 0 }));
    })
  };
}
