import { z } from "zod";

const uuid = z.string().uuid();

export const priceRuleIdParamSchema = z.object({
  id: uuid
});

export const createPriceRuleBodySchema = z
  .object({
    productId: uuid,
    ruleType: z.enum(["percent_off", "fixed_off", "override"]),
    value: z.coerce.number().int().min(0),
    priority: z.coerce.number().int(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime()
  })
  .superRefine((value, ctx) => {
    if (value.ruleType === "percent_off" && value.value > 10_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "percent_off value must be basis points from 0 to 10000"
      });
    }

    if (value.ruleType === "override" && value.value === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "override value must be greater than zero"
      });
    }

    if (Date.parse(value.endsAt) <= Date.parse(value.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "endsAt must be after startsAt"
      });
    }
  });
