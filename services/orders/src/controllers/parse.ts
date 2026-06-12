import type { Request } from "express";
import type { ZodTypeAny, z } from "zod";
import { orderValidationError } from "../domain/errors.js";

export const parseBody = <T extends ZodTypeAny>(
  schema: T,
  req: Request
): z.infer<T> => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw orderValidationError("INVALID_REQUEST_BODY", "Request body is invalid", {
      issues: result.error.issues
    });
  }
  return result.data;
};

export const parseParams = <T extends ZodTypeAny>(
  schema: T,
  req: Request
): z.infer<T> => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    throw orderValidationError("INVALID_REQUEST_PARAMS", "Request params are invalid", {
      issues: result.error.issues
    });
  }
  return result.data;
};

export const parseQuery = <T extends ZodTypeAny>(
  schema: T,
  req: Request
): z.infer<T> => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    throw orderValidationError("INVALID_REQUEST_QUERY", "Request query is invalid", {
      issues: result.error.issues
    });
  }
  return result.data;
};
