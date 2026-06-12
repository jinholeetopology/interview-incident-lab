import type { ZodType } from "zod";
import { validationError } from "../domain/errors.js";

export function parseWithSchema<T>(schema: ZodType<T>, value: unknown, source: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw validationError(`Invalid ${source}`, { source, issues: result.error.flatten() });
  }
  return result.data;
}
