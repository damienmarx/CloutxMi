import winston from "winston";
import path from "path";
import fs from "fs";
import { config } from "./config";

/**
 * Production-Ready Logging System
 * Provides comprehensive logging with multiple transports and log levels
 */

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
  TRACE = "trace",
}

/**
 * Create logger instance
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    config.logging.format === "json"
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = "";
          if (Object.keys(meta).length > 0) {
            metaStr = ` ${JSON.stringify(meta)}`;
          }
          return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
        })
  ),
  defaultMeta: {
    service: config.app.name,
    environment: config.app.environment,
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),

    // Combined log file
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),

    // Console output (in development)
    ...(config.logging.enableConsole
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                let metaStr = "";
                if (Object.keys(meta).length > 0 && meta.service !== config.app.name) {
                  metaStr = ` ${JSON.stringify(meta)}`;
                }
                return `${timestamp} [${level}] ${message}${metaStr}`;
              })
            ),
          }),
        ]
      : []),
  ],
});

/**
 * Structured logging interface
 */
export interface LogContext {
  userId?: number;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number; // milliseconds
  ipAddress?: string;
  [key: string]: any;
}

/**
 * Log error
 */
export function logError(message: string, error: Error | unknown, context?: LogContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(message, {
    error: errorMessage,
    stack: errorStack,
    ...context,
  });
}

/**
 * Log warning
 */
export function logWarn(message: string, context?: LogContext): void {
  logger.warn(message, context);
}

/**
 * Log info
 */
export function logInfo(message: string, context?: LogContext): void {
  logger.info(message, context);
}

/**
 * Log debug
 */
export function logDebug(message: string, context?: LogContext): void {
  logger.debug(message, context);
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void {
  const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
  const message = `${method} ${endpoint} - ${statusCode} (${duration}ms)`;

  logger[level as keyof typeof logger](message, {
    method,
    endpoint,
    statusCode,
    duration,
    ...context,
  });
}

/**
 * Log database query
 */
export function logDatabaseQuery(
  query: string,
  duration: number,
  success: boolean,
  context?: LogContext
): void {
  const level = success ? "debug" : "error";
  const message = `Database query executed in ${duration}ms`;

  logger[level as keyof typeof logger](message, {
    query,
    duration,
    success,
    ...context,
  });
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  eventType: "login" | "logout" | "register" | "password_reset",
  userId: number,
  success: boolean,
  context?: LogContext
): void {
  const message = `Authentication event: ${eventType}`;

  logger.info(message, {
    eventType,
    userId,
    success,
    ...context,
  });
}

/**
 * Log game event
 */
export function logGameEvent(
  gameType: string,
  userId: number,
  betAmount: number,
  winAmount: number,
  won: boolean,
  context?: LogContext
): void {
  const message = `Game played: ${gameType}`;

  logger.info(message, {
    gameType,
    userId,
    betAmount,
    winAmount,
    won,
    ...context,
  });
}

/**
 * Log wallet transaction
 */
export function logWalletTransaction(
  transactionType: "deposit" | "withdrawal" | "transfer",
  userId: number,
  amount: number,
  status: string,
  context?: LogContext
): void {
  const message = `Wallet transaction: ${transactionType}`;

  logger.info(message, {
    transactionType,
    userId,
    amount,
    status,
    ...context,
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  eventType: string,
  severity: "low" | "medium" | "high" | "critical",
  userId?: number,
  context?: LogContext
): void {
  const levelMap = {
    low: "info",
    medium: "warn",
    high: "error",
    critical: "error",
  };

  const level = levelMap[severity];
  const message = `Security event: ${eventType}`;

  logger[level as keyof typeof logger](message, {
    eventType,
    severity,
    userId,
    ...context,
  });
}

/**
 * Log performance metric
 */
export function logPerformanceMetric(
  metric: string,
  value: number,
  unit: string,
  context?: LogContext
): void {
  logger.debug(`Performance metric: ${metric}`, {
    metric,
    value,
    unit,
    ...context,
  });
}

/**
 * Create child logger with context
 */
export function createChildLogger(context: LogContext) {
  return logger.child(context);
}

/**
 * Flush logs (useful for graceful shutdown)
 */
export async function flushLogs(): Promise<void> {
  return new Promise((resolve) => {
    logger.on("finish", resolve);
    logger.end();
  });
}

export default logger;
