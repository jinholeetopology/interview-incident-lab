import type { Db } from "@atlas/shared";
import type { MovementRow } from "./repositoryTypes.js";

export class MovementsRepository {
  async insert(
    db: Db,
    movement: {
      id: string;
      warehouseId: string;
      productId: string;
      delta: number;
      reason: string;
      refType: string;
      refId: string;
    }
  ): Promise<MovementRow> {
    const rows = await db.query<MovementRow>(
      `
        INSERT INTO stock_movements (
          id,
          warehouse_id,
          product_id,
          delta,
          reason,
          ref_type,
          ref_id,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        RETURNING
          id,
          warehouse_id as "warehouseId",
          product_id as "productId",
          delta,
          reason,
          ref_type as "refType",
          ref_id as "refId",
          created_at as "createdAt"
      `,
      [
        movement.id,
        movement.warehouseId,
        movement.productId,
        movement.delta,
        movement.reason,
        movement.refType,
        movement.refId
      ]
    );

    return rows[0]!;
  }
}
