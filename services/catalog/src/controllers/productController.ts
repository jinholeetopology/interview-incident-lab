import type { RequestHandler } from "express";
import type { ProductService } from "../domain/productService.js";
import type { ProductCreateInput, ProductListFilters, ProductPatchInput } from "../domain/types.js";
import { asyncHandler } from "./asyncHandler.js";
import {
  listProductsQuerySchema,
  productCreateBodySchema,
  productIdParamSchema,
  productPatchBodySchema
} from "./productSchemas.js";
import { parseWithSchema } from "./validation.js";

export interface ProductController {
  list: RequestHandler;
  get: RequestHandler;
  create: RequestHandler;
  patch: RequestHandler;
}

export function createProductController(products: ProductService): ProductController {
  return {
    list: asyncHandler(async (req, res) => {
      const query = parseWithSchema(listProductsQuerySchema, req.query, "query");
      const { limit, offset, ...filters } = query;
      const result = await products.listProducts(filters as ProductListFilters, {
        limit: limit ?? 50,
        offset: offset ?? 0
      });
      res.json(result);
    }),

    get: asyncHandler(async (req, res) => {
      const params = parseWithSchema(productIdParamSchema, req.params, "params");
      res.json(await products.getProductById(params.id));
    }),

    create: asyncHandler(async (req, res) => {
      const body = parseWithSchema(productCreateBodySchema, req.body, "body") as ProductCreateInput;
      const product = await products.createProduct(body);
      res.status(201).json(product);
    }),

    patch: asyncHandler(async (req, res) => {
      const params = parseWithSchema(productIdParamSchema, req.params, "params");
      const body = parseWithSchema(productPatchBodySchema, req.body, "body") as ProductPatchInput;
      res.json(await products.updateProduct(params.id, body));
    })
  };
}
