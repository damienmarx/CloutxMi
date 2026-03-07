/**
 * Degens¤Den — Logger
 * Simple console-based logger with structured output.
 * Drop-in replacement for the winston-based logger.
 */

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
  TRACE = "trace",
}

type Meta = Record<string, unknown>;

const LEVEL_PRIORITY: Record<string, number> = {
  error: 0, warn: 1, info: 2, debug: 3, trace: 4,
};

const activeLevel = (process.env.LOG_LEVEL || "info").toLowerCase();

function shouldLog(level: string): boolean {
  return (LEVEL_PRIORITY[level] ?? 99) <= (LEVEL_PRIORITY[activeLevel] ?? 2);
}

function format(level: string, message: string, meta?: Meta): string {
  const ts = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `${ts} [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  error(message: string, meta?: Meta): void {
    if (shouldLog("error")) console.error(format("error", message, meta));
  },
  warn(message: string, meta?: Meta): void {
    if (shouldLog("warn")) console.warn(format("warn", message, meta));
  },
  info(message: string, meta?: Meta): void {
    if (shouldLog("info")) console.info(format("info", message, meta));
  },
  debug(message: string, meta?: Meta): void {
    if (shouldLog("debug")) console.debug(format("debug", message, meta));
  },
  trace(message: string, meta?: Meta): void {
    if (shouldLog("trace")) console.debug(format("trace", message, meta));
  },
  // winston compat shims
  http(message: string, meta?: Meta): void {
    if (shouldLog("debug")) console.log(format("http", message, meta));
  },
  log(level: string, message: string, meta?: Meta): void {
    if (shouldLog(level)) console.log(format(level, message, meta));
  },
};

export type Logger = typeof logger;
export default logger;
