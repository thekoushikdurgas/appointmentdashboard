export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppLogger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, err?: unknown, ctx?: Record<string, unknown>): void;
}

const isDev = process.env.NODE_ENV === "development";

function formatScope(scope: string, msg: string): string {
  return `[${scope}] ${msg}`;
}

function mergeCtx(
  ctx?: Record<string, unknown>,
  err?: unknown,
): Record<string, unknown> | undefined {
  if (err === undefined && ctx === undefined) return undefined;
  return { ...ctx, ...(err !== undefined ? { error: err } : {}) };
}

export function createLogger(scope: string): AppLogger {
  return {
    debug(msg, ctx) {
      if (!isDev) return;
      console.debug(formatScope(scope, msg), ctx ?? "");
    },
    info(msg, ctx) {
      if (!isDev) return;
      console.info(formatScope(scope, msg), ctx ?? "");
    },
    warn(msg, ctx) {
      console.warn(formatScope(scope, msg), ctx ?? "");
    },
    error(msg, err, ctx) {
      const payload = mergeCtx(ctx, err);
      if (payload !== undefined)
        console.error(formatScope(scope, msg), payload);
      else console.error(formatScope(scope, msg));
    },
  };
}

/** Root logger for app-wide messages without a dedicated scope. */
export const logger = createLogger("app");
