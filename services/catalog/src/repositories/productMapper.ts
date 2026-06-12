import { asCurrency } from "../domain/currency.js";
import { toIsoString } from "../domain/time.js";
import type { Product, ProductStatus } from "../domain/types.js";
import type { ProductRow } from "./repositoryTypes.js";

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    basePriceCents: Number(row.base_price_cents),
    currency: asCurrency(row.currency),
    status: row.status as ProductStatus,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}
