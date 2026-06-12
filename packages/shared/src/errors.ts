import type express from "express";
import type { Logger } from "./logger.js";

export class AppError extends Error {
  code: string;
  status: number;
  ctx?: object;

  constructor(code: string, status: number, message: string, ctx?: object) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    if (ctx !== undefined) {
      this.ctx = ctx;
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", ctx?: object) {
    super("NOT_FOUND", 404, message, ctx);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", ctx?: object) {
    super("CONFLICT", 409, message, ctx);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", ctx?: object) {
    super("VALIDATION_ERROR", 400, message, ctx);
  }
}

export class UpstreamError extends AppError {
  body: unknown;

  constructor(service: string, status: number, body: unknown, message = "Upstream request failed") {
    super("UPSTREAM_ERROR", status, message, { service, body });
    this.body = body;
  }
}

export const errorHandler = (logger: Logger): express.ErrorRequestHandler => {
  return (err, req, res, _next) => {
    const requestId = req.header("x-request-id");
    if (err instanceof AppError) {
      logger.warn("request_failed", {
        requestId,
        code: err.code,
        status: err.status,
        ...err.ctx
      });
      res.status(err.status).json({ error: { code: err.code, message: err.message } });
      return;
    }

    logger.error("unhandled_error", {
      requestId,
      error: err instanceof Error ? err.message : String(err)
    });
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  };
};
