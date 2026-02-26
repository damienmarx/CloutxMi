/**
 * CloutScape Error Handler
 * Comprehensive error handling, logging, and recovery system
 */

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  SERVER = "server",
  CLIENT = "client",
  DATABASE = "database",
  UNKNOWN = "unknown",
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  timestamp?: Date;
  userAgent?: string;
  [key: string]: any;
}

export interface ErrorReport {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  stack?: string;
  originalError?: Error;
}

/**
 * Custom Error Class
 */
export class AppError extends Error {
  public readonly id: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {}
  ) {
    super(message);
    this.name = "AppError";
    this.id = generateErrorId();
    this.category = category;
    this.severity = severity;
    this.context = {
      ...context,
      timestamp: new Date(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };
    this.timestamp = new Date();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ErrorReport {
    return {
      id: this.id,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
      originalError: this,
    };
  }
}

/**
 * Error Handler Singleton
 */
class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorReport[] = [];
  private maxLogSize: number = 100;
  private errorCallbacks: Array<(error: ErrorReport) => void> = [];

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event: ErrorEvent) => {
        this.handleError(
          event.error || new Error(event.message),
          ErrorCategory.CLIENT,
          ErrorSeverity.HIGH
        );
      });

      // Handle unhandled promise rejections
      window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
        this.handleError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          ErrorCategory.CLIENT,
          ErrorSeverity.HIGH
        );
      });
    }
  }

  /**
   * Handle error
   */
  handleError(
    error: Error | string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {}
  ): ErrorReport {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(
            typeof error === "string" ? error : error.message,
            category,
            severity,
            context
          );

    const report = appError.toJSON();

    // Add to log
    this.addToLog(report);

    // Trigger callbacks
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(report);
      } catch (err) {
        console.error("Error in error callback:", err);
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorHandler]", report);
    }

    // Send to server in production
    if (process.env.NODE_ENV === "production" && severity !== ErrorSeverity.LOW) {
      this.sendToServer(report);
    }

    return report;
  }

  /**
   * Add error to log
   */
  private addToLog(report: ErrorReport): void {
    this.errorLog.push(report);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Send error to server
   */
  private sendToServer(report: ErrorReport): void {
    try {
      // Use navigator.sendBeacon for reliability
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/errors/report", JSON.stringify(report));
      } else {
        // Fallback to fetch
        fetch("/api/errors/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report),
          keepalive: true,
        }).catch(() => {
          // Silently fail if server is unreachable
        });
      }
    } catch (err) {
      console.error("Failed to send error to server:", err);
    }
  }

  /**
   * Register error callback
   */
  onError(callback: (error: ErrorReport) => void): () => void {
    this.errorCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Get error log
   */
  getLog(): ErrorReport[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errorLog.filter((report) => report.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return this.errorLog.filter((report) => report.severity === severity);
  }

  /**
   * Export logs
   */
  exportLogs(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Error Recovery Strategies
 */
export const ErrorRecoveryStrategies = {
  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxAttempts) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Max retry attempts exceeded");
  },

  /**
   * Fallback to cached data
   */
  async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => T | Promise<T>
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      console.warn("Primary operation failed, using fallback:", error);
      return fallback();
    }
  },

  /**
   * Timeout wrapper
   */
  async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 5000
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new AppError(
                `Operation timed out after ${timeoutMs}ms`,
                ErrorCategory.CLIENT,
                ErrorSeverity.MEDIUM
              )
            ),
          timeoutMs
        )
      ),
    ]);
  },

  /**
   * Circuit breaker pattern
   */
  createCircuitBreaker<T>(
    fn: () => Promise<T>,
    failureThreshold: number = 5,
    resetTimeout: number = 60000
  ) {
    let failureCount = 0;
    let lastFailureTime: number | null = null;
    let state: "closed" | "open" | "half-open" = "closed";

    return async (): Promise<T> => {
      // Check if circuit should reset
      if (state === "open" && lastFailureTime) {
        if (Date.now() - lastFailureTime > resetTimeout) {
          state = "half-open";
          failureCount = 0;
        } else {
          throw new AppError(
            "Circuit breaker is open",
            ErrorCategory.CLIENT,
            ErrorSeverity.MEDIUM
          );
        }
      }

      try {
        const result = await fn();
        if (state === "half-open") {
          state = "closed";
          failureCount = 0;
        }
        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = Date.now();

        if (failureCount >= failureThreshold) {
          state = "open";
        }

        throw error;
      }
    };
  },
};

/**
 * User-friendly error messages
 */
export const UserFriendlyErrors = {
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  AUTH_ERROR: "Authentication failed. Please log in again.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  NOT_FOUND: "The requested resource was not found.",
  UNAUTHORIZED: "You don't have permission to perform this action.",
  FORBIDDEN: "Access denied.",
  CONFLICT: "This resource already exists.",
  RATE_LIMITED: "Too many requests. Please try again later.",
  MAINTENANCE: "We're currently performing maintenance. Please try again later.",
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        return UserFriendlyErrors.NETWORK_ERROR;
      case ErrorCategory.AUTHENTICATION:
        return UserFriendlyErrors.AUTH_ERROR;
      case ErrorCategory.VALIDATION:
        return UserFriendlyErrors.VALIDATION_ERROR;
      case ErrorCategory.AUTHORIZATION:
        return UserFriendlyErrors.UNAUTHORIZED;
      default:
        return UserFriendlyErrors.SERVER_ERROR;
    }
  }

  return UserFriendlyErrors.SERVER_ERROR;
}

/**
 * Export singleton instance
 */
export const errorHandler = ErrorHandler.getInstance();

export default errorHandler;
