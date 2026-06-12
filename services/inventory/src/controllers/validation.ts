import { ValidationError } from "@atlas/shared";
import type { z } from "zod";

export const parseRequest = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError("Invalid request", {
      issues: parsed.error.issues
    });
  }

  return parsed.data;
};
