import { Request, Response, NextFunction } from "express";

/**
 * Advanced Rate Limiting System
 * Provides sophisticated rate limiting with multiple strategies
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  message?: string; // Custom error message
}

export interface RateLimitStore {
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
  get(key: string): Promise<number | null>;
}

/**
 * In-memory rate limit store
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  async increment(key: string): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute default
      return 1;
    }

    entry.count++;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }

    return entry.count;
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Create advanced rate limiter middleware
 */
export function createAdvancedRateLimiter(config: RateLimitConfig, store?: RateLimitStore) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: Request) => req.ip || "unknown",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = "Too many requests, please try again later",
  } = config;

  const rateLimitStore = store || new InMemoryRateLimitStore();

  // Cleanup old entries periodically
  if (store instanceof InMemoryRateLimitStore) {
    setInterval(() => store.cleanup(), 60000);
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const count = await rateLimitStore.increment(key);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - count));
    res.setHeader("X-RateLimit-Reset", new Date(Date.now() + windowMs).toISOString());

    if (count > maxRequests) {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
      return;
    }

    // Store original send method
    const originalSend = res.send;

    // Override send method to check response status
    res.send = function (data: any) {
      if (skipSuccessfulRequests && res.statusCode < 400) {
        // Don't count successful requests
        rateLimitStore.reset(key);
      } else if (skipFailedRequests && res.statusCode >= 400) {
        // Don't count failed requests
        rateLimitStore.reset(key);
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Endpoint-specific rate limiters
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations
  },
  forgotPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 requests
  },

  // Game endpoints
  playGame: {
    windowMs: 1000, // 1 second
    maxRequests: 10, // 10 games per second
  },
  spinSlots: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 spins per minute
  },

  // Wallet endpoints
  deposit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 deposits per hour
  },
  withdrawal: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 withdrawals per hour
  },

  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
};

/**
 * Adaptive rate limiter that adjusts based on server load
 */
export class AdaptiveRateLimiter {
  private baseConfig: RateLimitConfig;
  private store: RateLimitStore;
  private cpuThreshold: number = 80; // CPU usage percentage
  private memoryThreshold: number = 85; // Memory usage percentage

  constructor(baseConfig: RateLimitConfig, store?: RateLimitStore) {
    this.baseConfig = baseConfig;
    this.store = store || new InMemoryRateLimitStore();
  }

  /**
   * Get adaptive config based on system load
   */
  private getAdaptiveConfig(): RateLimitConfig {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();

    // Estimate CPU usage (simplified)
    const estimatedCpuUsage = (cpuUsage.user / 1000000) % 100;

    // Calculate memory usage percentage
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // If system is under heavy load, reduce rate limits
    if (estimatedCpuUsage > this.cpuThreshold || memUsagePercent > this.memoryThreshold) {
      return {
        ...this.baseConfig,
        maxRequests: Math.max(1, Math.floor(this.baseConfig.maxRequests * 0.5)),
      };
    }

    return this.baseConfig;
  }

  /**
   * Create middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const config = this.getAdaptiveConfig();
      const limiter = createAdvancedRateLimiter(config, this.store);
      return limiter(req, res, next);
    };
  }
}

/**
 * Request validation middleware
 */
export function validateRequest(schema: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (req.body) {
        await schema.parseAsync(req.body);
      }

      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
        details: error.errors || error.message,
      });
    }
  };
}

/**
 * Request size limiter
 */
export function limitRequestSize(maxSizeInMB: number = 10) {
  const maxBytes = maxSizeInMB * 1024 * 1024;

  return (req: Request, res: Response, next: NextFunction) => {
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;

      if (size > maxBytes) {
        res.status(413).json({
          success: false,
          error: `Request payload too large (max ${maxSizeInMB}MB)`,
        });
        req.pause();
      }
    });

    next();
  };
}

/**
 * IP whitelist/blacklist middleware
 */
export function createIPFilter(options: { whitelist?: string[]; blacklist?: string[] }) {
  const { whitelist, blacklist } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || "unknown";

    if (blacklist && blacklist.includes(clientIP)) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    if (whitelist && !whitelist.includes(clientIP)) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    next();
  };
}

/**
 * Duplicate request detection
 */
export class DuplicateRequestDetector {
  private requestHashes: Map<string, { hash: string; timestamp: number }> = new Map();
  private hashWindow: number = 5000; // 5 seconds

  /**
   * Generate request hash
   */
  private generateHash(req: Request): string {
    const crypto = require("crypto");
    const content = JSON.stringify({
      method: req.method,
      path: req.path,
      body: req.body,
    });
    return crypto.createHash("md5").update(content).digest("hex");
  }

  /**
   * Check for duplicate request
   */
  isDuplicate(req: Request): boolean {
    const key = req.ip || "unknown";
    const hash = this.generateHash(req);
    const now = Date.now();

    const existing = this.requestHashes.get(key);

    if (existing && existing.hash === hash && now - existing.timestamp < this.hashWindow) {
      return true;
    }

    this.requestHashes.set(key, { hash, timestamp: now });

    // Cleanup old entries
    for (const [k, v] of this.requestHashes.entries()) {
      if (now - v.timestamp > this.hashWindow) {
        this.requestHashes.delete(k);
      }
    }

    return false;
  }

  /**
   * Create middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (this.isDuplicate(req)) {
        res.status(409).json({
          success: false,
          error: "Duplicate request detected",
        });
        return;
      }

      next();
    };
  }
}
