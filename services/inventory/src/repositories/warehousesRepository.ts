import type { Db } from "@atlas/shared";
import type { WarehouseRow } from "./repositoryTypes.js";
import { warehouseColumns } from "./queryFragments.js";

export class WarehousesRepository {
  async list(db: Db, limit: number, offset: number): Promise<{ items: WarehouseRow[]; total: number }> {
    const [items, totals] = await Promise.all([
      db.query<WarehouseRow>(
        `
          SELECT ${warehouseColumns}
          FROM warehouses
          ORDER BY code
          LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      db.query<{ total: string }>(
        `
          SELECT count(*)::text as total
          FROM warehouses
        `
      )
    ]);

    return {
      items,
      total: Number(totals[0]?.total ?? 0)
    };
  }
}
