import type { Db } from "@atlas/shared";
import type { AllocationCandidateRow, StockLevelRow } from "./repositoryTypes.js";
import { stockLevelColumns } from "./queryFragments.js";

export class StockLevelsRepository {
  async listForProduct(db: Db, productId: string): Promise<StockLevelRow[]> {
    return db.query<StockLevelRow>(
      `
        SELECT ${stockLevelColumns}
        FROM stock_levels
        WHERE product_id = $1
        ORDER BY warehouse_id
      `,
      [productId]
    );
  }

  async listAvailableForProduct(db: Db, productId: string): Promise<AllocationCandidateRow[]> {
    return db.query<AllocationCandidateRow>(
      `
        SELECT
          ${stockLevelColumns},
          on_hand - reserved as available
        FROM stock_levels
        WHERE product_id = $1
          AND on_hand - reserved > 0
        ORDER BY available DESC, warehouse_id
      `,
      [productId]
    );
  }

  async reserveAvailable(
    db: Db,
    warehouseId: string,
    productId: string,
    qty: number
  ): Promise<StockLevelRow | null> {
    const rows = await db.query<StockLevelRow>(
      `
        UPDATE stock_levels
        SET reserved = reserved + $3,
            updated_at = now()
        WHERE warehouse_id = $1
          AND product_id = $2
          AND on_hand - reserved >= $3
        RETURNING ${stockLevelColumns}
      `,
      [warehouseId, productId, qty]
    );

    return rows[0] ?? null;
  }

  async commitReserved(
    db: Db,
    warehouseId: string,
    productId: string,
    qty: number
  ): Promise<StockLevelRow | null> {
    const currentRows = await db.query<StockLevelRow>(
      `
        SELECT ${stockLevelColumns}
        FROM stock_levels
        WHERE warehouse_id = $1
          AND product_id = $2
      `,
      [warehouseId, productId]
    );

    const current = currentRows[0];
    if (!current || current.reserved < qty || current.onHand < qty) {
      return null;
    }

    const rows = await db.query<StockLevelRow>(
      `
        UPDATE stock_levels
        SET on_hand = $3,
            reserved = $4,
            updated_at = now()
        WHERE warehouse_id = $1
          AND product_id = $2
        RETURNING ${stockLevelColumns}
      `,
      [warehouseId, productId, current.onHand - qty, current.reserved - qty]
    );

    return rows[0] ?? null;
  }

  async releaseReserved(
    db: Db,
    warehouseId: string,
    productId: string,
    qty: number
  ): Promise<StockLevelRow | null> {
    const rows = await db.query<StockLevelRow>(
      `
        UPDATE stock_levels
        SET reserved = reserved - $3,
            updated_at = now()
        WHERE warehouse_id = $1
          AND product_id = $2
          AND reserved >= $3
        RETURNING ${stockLevelColumns}
      `,
      [warehouseId, productId, qty]
    );

    return rows[0] ?? null;
  }

  async adjustOnHand(
    db: Db,
    warehouseId: string,
    productId: string,
    delta: number
  ): Promise<StockLevelRow | null> {
    const rows = await db.query<StockLevelRow>(
      `
        UPDATE stock_levels
        SET on_hand = on_hand + $3,
            updated_at = now()
        WHERE warehouse_id = $1
          AND product_id = $2
          AND on_hand + $3 >= 0
        RETURNING ${stockLevelColumns}
      `,
      [warehouseId, productId, delta]
    );

    return rows[0] ?? null;
  }

  async exists(db: Db, warehouseId: string, productId: string): Promise<boolean> {
    const rows = await db.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM stock_levels
          WHERE warehouse_id = $1
            AND product_id = $2
        ) as "exists"
      `,
      [warehouseId, productId]
    );

    return rows[0]?.exists ?? false;
  }
}
