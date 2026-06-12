import type { Currency } from "./currency.js";

export const PRODUCT_STATUSES = ["active", "discontinued"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const CUSTOMER_TIERS = ["standard", "gold", "platinum"] as const;
export type CustomerTier = (typeof CUSTOMER_TIERS)[number];

export const PRICE_RULE_TYPES = ["percent_off", "fixed_off", "override"] as const;
export type PriceRuleType = (typeof PRICE_RULE_TYPES)[number];

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  basePriceCents: number;
  currency: Currency;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export interface PriceRule {
  id: string;
  productId: string;
  ruleType: PriceRuleType;
  value: number;
  priority: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface ProductListFilters {
  categoryId?: string;
  status?: ProductStatus;
  sku?: string;
}

export interface Pagination {
  limit: number;
  offset: number;
}

export interface ProductCreateInput {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  basePriceCents: number;
  currency: Currency;
  status: ProductStatus;
}

export interface ProductPatchInput {
  sku?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  basePriceCents?: number;
  currency?: Currency;
  status?: ProductStatus;
}

export interface PriceRuleCreateInput {
  productId: string;
  ruleType: PriceRuleType;
  value: number;
  priority: number;
  startsAt: string;
  endsAt: string;
}

export interface PriceRequest {
  productId: string;
  customerTier: CustomerTier;
  currency?: Currency;
  qty: number;
  requestId?: string;
}

export interface ComputedPrice {
  productId: string;
  currency: Currency;
  qty: number;
  unitPriceCents: number;
  appliedRuleIds: string[];
}
