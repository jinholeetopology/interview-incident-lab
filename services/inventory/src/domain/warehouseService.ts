import type { Cache, Db } from "@atlas/shared";
import { CACHE_KEYS, WAREHOUSE_CACHE_TTL_SEC } from "../constants.js";
import type { WarehousesRepository } from "../repositories/warehousesRepository.js";
import type { ListResult, WarehouseResult } from "./resultTypes.js";

export class WarehouseService {
  constructor(
    private readonly db: Db,
    private readonly cache: Cache,
    private readonly warehouses: WarehousesRepository
  ) {}

  async list(limit: number, offset: number): Promise<ListResult<WarehouseResult>> {
    const cacheKey = `${CACHE_KEYS.warehousesList}:${limit}:${offset}`;
    return this.cache.withCache(cacheKey, WAREHOUSE_CACHE_TTL_SEC, () =>
      this.warehouses.list(this.db, limit, offset)
    );
  }
}
