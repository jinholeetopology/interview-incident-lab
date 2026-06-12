import { z } from "zod";

export const reservationIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const createReservationBodySchema = z.object({
  orderId: z.string().uuid(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().positive()
      })
    )
    .min(1)
});
