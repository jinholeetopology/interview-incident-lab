export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
  child(ctx: Record<string, unknown>): Logger;
}

type LogLevel = "debug" | "info" | "warn" | "error";

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const parseLevel = (raw: string | undefined): LogLevel => {
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
};

export const createLogger = (service: string): Logger => {
  const minLevel = parseLevel(process.env.LOG_LEVEL);
  return createJsonLogger(service, minLevel, {});
};

const createJsonLogger = (
  service: string,
  minLevel: LogLevel,
  baseCtx: Record<string, unknown>
): Logger => {
  const write = (level: LogLevel, msg: string, ctx: Record<string, unknown> = {}) => {
    if (levelWeight[level] < levelWeight[minLevel]) {
      return;
    }

    const entry = {
      service,
      level,
      msg,
      time: new Date().toISOString(),
      ...baseCtx,
      ...ctx
    };

    const line = JSON.stringify(entry);
    if (level === "error") {
      console.error(line);
      return;
    }
    if (level === "warn") {
      console.warn(line);
      return;
    }
    console.log(line);
  };

  return {
    debug: (msg, ctx) => write("debug", msg, ctx),
    info: (msg, ctx) => write("info", msg, ctx),
    warn: (msg, ctx) => write("warn", msg, ctx),
    error: (msg, ctx) => write("error", msg, ctx),
    child: (ctx) => createJsonLogger(service, minLevel, { ...baseCtx, ...ctx })
  };
};
