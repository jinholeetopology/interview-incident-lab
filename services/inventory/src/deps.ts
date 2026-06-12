import type { Cache, Db, Logger } from "@atlas/shared";
import type { AdjustmentService } from "./domain/adjustmentService.js";
import type { ReservationService } from "./domain/reservationService.js";
import type { StockService } from "./domain/stockService.js";
import type { WarehouseService } from "./domain/warehouseService.js";

export interface InventoryDeps {
  db: Db;
  cache: Cache;
  logger: Logger;
  stockService: StockService;
  reservationService: ReservationService;
  adjustmentService: AdjustmentService;
  warehouseService: WarehouseService;
}
