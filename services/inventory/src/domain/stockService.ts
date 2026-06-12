import type { Db } from "@atlas/shared";
import type { StockLevelsRepository } from "../repositories/stockLevelsRepository.js";
import type { StockSnapshot } from "./resultTypes.js";

export class StockService {
  constructor(
    private readonly db: Db,
    private readonly stockLevels: StockLevelsRepository
  ) {}

  async getProductStock(productId: string): Promise<StockSnapshot> {
    const rows = await this.stockLevels.listForProduct(this.db, productId);
    const byWarehouse = rows.map((row) => ({
      warehouseId: row.warehouseId,
      onHand: row.onHand,
      reserved: row.reserved
    }));

    const total = byWarehouse.reduce(
      (acc, row) => ({
        onHand: acc.onHand + row.onHand,
        reserved: acc.reserved + row.reserved
      }),
      { onHand: 0, reserved: 0 }
    );

    return {
      productId,
      total,
      byWarehouse
    };
  }
}
