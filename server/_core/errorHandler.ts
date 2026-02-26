import { TRPCError } from "@trpc/server";

/**
 * Comprehensive Error Handling System
 * Provides standardized error responses and logging for production
 */

export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Validation errors
  INVALID_INPUT = "INVALID_INPUT",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Wallet errors
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  WALLET_NOT_FOUND = "WALLET_NOT_FOUND",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",

  // Game errors
  GAME_NOT_FOUND = "GAME_NOT_FOUND",
  INVALID_BET = "INVALID_BET",
  GAME_ERROR = "GAME_ERROR",

  // Database errors
  DATABASE_ERROR = "DATABASE_ERROR",
  QUERY_FAILED = "QUERY_FAILED",

  // Server errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Business logic errors
  BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR",
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
  details?: any;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log error with context
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${timestamp}] [${context}] Error: ${errorMessage}`, {
    stack: errorStack,
    ...additionalInfo,
  });
}

/**
 * Convert AppError to TRPC error
 */
export function toTRPCError(error: AppError): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: error.message,
    cause: error,
  });
}

/**
 * Validate input and throw error if invalid
 */
export function validateInput<T>(
  data: T,
  validator: (data: T) => { valid: boolean; errors?: string[] }
): T {
  const result = validator(data);
  if (!result.valid) {
    throw new AppError(
      ErrorCode.VALIDATION_FAILED,
      result.errors?.[0] || "Validation failed",
      400,
      { errors: result.errors }
    );
  }
  return data;
}

/**
 * Safe async wrapper for error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string,
  defaultValue?: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(context, error);
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw error;
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.INVALID_CREDENTIALS]: "Invalid username or password",
    [ErrorCode.USER_NOT_FOUND]: "User not found",
    [ErrorCode.USER_ALREADY_EXISTS]: "Username or email already in use",
    [ErrorCode.INVALID_TOKEN]: "Invalid or expired token",
    [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please log in again",
    [ErrorCode.UNAUTHORIZED]: "You do not have permission to perform this action",
    [ErrorCode.INVALID_INPUT]: "Invalid input provided",
    [ErrorCode.VALIDATION_FAILED]: "Validation failed. Please check your input",
    [ErrorCode.MISSING_REQUIRED_FIELD]: "Required field is missing",
    [ErrorCode.INSUFFICIENT_BALANCE]: "Insufficient balance for this transaction",
    [ErrorCode.INVALID_AMOUNT]: "Invalid amount provided",
    [ErrorCode.WALLET_NOT_FOUND]: "Wallet not found",
    [ErrorCode.TRANSACTION_FAILED]: "Transaction failed. Please try again",
    [ErrorCode.GAME_NOT_FOUND]: "Game not found",
    [ErrorCode.INVALID_BET]: "Invalid bet amount",
    [ErrorCode.GAME_ERROR]: "An error occurred while playing the game",
    [ErrorCode.DATABASE_ERROR]: "Database error occurred",
    [ErrorCode.QUERY_FAILED]: "Database query failed",
    [ErrorCode.INTERNAL_SERVER_ERROR]: "An unexpected error occurred. Please try again later",
    [ErrorCode.SERVICE_UNAVAILABLE]: "Service is temporarily unavailable",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "Too many requests. Please wait before trying again",
    [ErrorCode.BUSINESS_LOGIC_ERROR]: "Operation failed due to business logic constraints",
    [ErrorCode.OPERATION_NOT_ALLOWED]: "This operation is not allowed",
  };

  return messages[code] || "An unexpected error occurred";
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
