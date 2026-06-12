import { z } from "zod";

const paginationNumber = (defaultValue: number) =>
  z
    .preprocess((value) => (value === undefined ? defaultValue : value), z.coerce.number().int())
    .refine((value) => value >= 0, "must be non-negative");

export const paginationSchema = z.object({
  limit: paginationNumber(50).refine((value) => value > 0 && value <= 200, "must be 1..200"),
  offset: paginationNumber(0)
});
