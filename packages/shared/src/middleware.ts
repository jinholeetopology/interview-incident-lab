import { randomUUID } from "node:crypto";
import express from "express";
import type { Logger } from "./logger.js";

type RequestWithId = express.Request & { id: string };

export const requestId = (): express.RequestHandler => {
  return (req, res, next) => {
    const incoming = req.header("x-request-id");
    const id = incoming && incoming.length > 0 ? incoming : randomUUID();
    (req as RequestWithId).id = id;
    res.setHeader("x-request-id", id);
    next();
  };
};

export const accessLog = (logger: Logger): express.RequestHandler => {
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      logger.info("http_request", {
        requestId: req.header("x-request-id"),
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(durationMs)
      });
    });
    next();
  };
};

export const healthRouter = (
  checks: { name: string; check: () => Promise<void> }[]
): express.Router => {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/ready", async (_req, res) => {
    const results = await Promise.all(
      checks.map(async ({ name, check }) => {
        try {
          await check();
          return { name, status: "ok" };
        } catch (err) {
          return {
            name,
            status: "error",
            message: err instanceof Error ? err.message : String(err)
          };
        }
      })
    );

    const ok = results.every((result) => result.status === "ok");
    res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "error", checks: results });
  });

  return router;
};
