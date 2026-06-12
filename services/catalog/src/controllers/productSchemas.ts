import { z } from "zod";
import { isSupportedCurrency, normalizeCurrency } from "../domain/currency.js";
import { PRICE_CACHE_QTY_MAX, PRICE_CACHE_QTY_MIN } from "../domain/cacheKeys.js";
import { paginationQuerySchema } from "./pagination.js";

const uuid = z.string().uuid();
const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform(normalizeCurrency)
  .refine(isSupportedCurrency, "unsupported currency");

export const productIdParamSchema = z.object({
  id: uuid
});

export const listProductsQuerySchema = paginationQuerySchema.extend({
  categoryId: uuid.optional(),
  status: z.enum(["active", "discontinued"]).optional(),
  sku: z.string().trim().min(1).max(80).optional()
});

export const productCreateBodySchema = z.object({
  sku: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  categoryId: uuid,
  basePriceCents: z.coerce.number().int().min(0),
  currency: currencySchema.default("USD"),
  status: z.enum(["active", "discontinued"]).default("active")
});

export const productPatchBodySchema = z
  .object({
    sku: z.string().trim().min(1).max(80).optional(),
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    categoryId: uuid.optional(),
    basePriceCents: z.coerce.number().int().min(0).optional(),
    currency: currencySchema.optional(),
    status: z.enum(["active", "discontinued"]).optional()
  })
  .refine((value) => Object.keys(value).length > 0, "patch body must include at least one field");

export const priceQuerySchema = z.object({
  customerTier: z.enum(["standard", "gold", "platinum"]).default("standard"),
  currency: currencySchema.optional(),
  qty: z.coerce.number().int().min(PRICE_CACHE_QTY_MIN).max(PRICE_CACHE_QTY_MAX).default(1)
});
