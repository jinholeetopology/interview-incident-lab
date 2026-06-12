import { z } from "zod";

export const createAdjustmentBodySchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  delta: z.number().int().refine((value) => value !== 0, "delta must be non-zero"),
  reason: z.string().trim().min(1).max(120)
});
