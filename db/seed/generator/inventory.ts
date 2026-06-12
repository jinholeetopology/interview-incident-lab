import type { Rng } from "./rng.js";
import { stableUuid } from "./uuid.js";
import type { ProductSeed, WarehouseSeed } from "./types.js";

export const createWarehouses = (): WarehouseSeed[] => [
  {
    id: stableUuid("warehouse-us-west"),
    code: "US-WEST",
    name: "Los Angeles Regional DC",
    region: "US-WEST"
  },
  {
    id: stableUuid("warehouse-us-east"),
    code: "US-EAST",
    name: "New Jersey Regional DC",
    region: "US-EAST"
  },
  {
    id: stableUuid("warehouse-apac"),
    code: "APAC-SEOUL",
    name: "Seoul APAC DC",
    region: "APAC"
  }
];

export const createStockLevels = (
  products: ProductSeed[],
  warehouses: WarehouseSeed[],
  rng: Rng
): { warehouseId: string; productId: string; onHand: number }[] => {
  const rows: { warehouseId: string; productId: string; onHand: number }[] = [];
  for (const [index, product] of products.entries()) {
    const count = 1 + (index % 3);
    for (let offset = 0; offset < count; offset += 1) {
      const warehouse = warehouses[(index + offset) % warehouses.length];
      if (warehouse === undefined) {
        throw new Error("warehouses are required");
      }
      rows.push({
        warehouseId: warehouse.id,
        productId: product.id,
        onHand: rng.int(50, 500)
      });
    }
  }
  return rows;
};
