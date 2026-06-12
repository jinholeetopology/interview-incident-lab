import type { Db } from "@atlas/shared";
import {
  stockAdjustmentWouldGoNegative,
  stockLevelNotFound
} from "./errors.js";
import type { AdjustmentInput } from "./adjustmentTypes.js";
import type { AdjustmentResult } from "./resultTypes.js";
import { MOVEMENT_REF_TYPE } from "./stockMovement.js";
import { uuid, type IdGenerator } from "../utils/ids.js";
import type { MovementsRepository } from "../repositories/movementsRepository.js";
import type { StockLevelsRepository } from "../repositories/stockLevelsRepository.js";

export class AdjustmentService {
  constructor(
    private readonly db: Db,
    private readonly stockLevels: StockLevelsRepository,
    private readonly movements: MovementsRepository,
    private readonly idGenerator: IdGenerator = uuid
  ) {}

  async adjust(input: AdjustmentInput): Promise<AdjustmentResult> {
    return this.db.withTx(async (tx) => {
      const updated = await this.stockLevels.adjustOnHand(
        tx,
        input.warehouseId,
        input.productId,
        input.delta
      );

      if (!updated) {
        const exists = await this.stockLevels.exists(tx, input.warehouseId, input.productId);
        if (!exists) {
          throw stockLevelNotFound(input.warehouseId, input.productId);
        }
        throw stockAdjustmentWouldGoNegative(input.warehouseId, input.productId);
      }

      const adjustmentId = this.idGenerator();
      const movement = await this.movements.insert(tx, {
        id: this.idGenerator(),
        warehouseId: input.warehouseId,
        productId: input.productId,
        delta: input.delta,
        reason: input.reason,
        refType: MOVEMENT_REF_TYPE.adjustment,
        refId: adjustmentId
      });

      return {
        warehouseId: updated.warehouseId,
        productId: updated.productId,
        onHand: updated.onHand,
        reserved: updated.reserved,
        movementId: movement.id
      };
    });
  }
}
