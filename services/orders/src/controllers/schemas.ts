import { z } from "zod";
import { orderStatuses } from "../domain/models.js";

const uuid = z.string().uuid();

export const createOrderSchema = z.object({
  customerId: uuid,
  lines: z
    .array(
      z.object({
        productId: uuid,
        qty: z.number().int().min(1)
      })
    )
    .min(1)
});

export const orderIdParamsSchema = z.object({
  id: uuid
});

export const listOrdersQuerySchema = z.object({
  customerId: uuid.optional(),
  status: z.enum(orderStatuses).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const shipOrderSchema = z.object({
  carrier: z.string().trim().min(1).max(80).optional(),
  trackingNo: z.string().trim().min(1).max(80).optional()
}).default({});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type ShipOrderBody = z.infer<typeof shipOrderSchema>;
