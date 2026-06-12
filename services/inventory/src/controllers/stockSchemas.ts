import { z } from "zod";

export const productIdParamsSchema = z.object({
  productId: z.string().uuid()
});
