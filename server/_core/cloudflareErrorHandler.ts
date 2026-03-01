/**
 * Cloudflare Error Handler and Fallback Utilities
 * Provides comprehensive error handling with multiple fallback strategies
 */

import { logger } from './logger';

export interface CloudflareErrorConfig {
  maxRetries: number;
  retryDelayMs: number;
  fallbackOrigins: string[];
  timeoutMs: number;
  enableCircuitBreaker: boolean;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
}

const DEFAULT_CONFIG: CloudflareErrorConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  fallbackOrigins: [],
  timeoutMs: 5000,
  enableCircuitBreaker: true,
};

class CloudflareErrorHandler {
  private config: CloudflareErrorConfig;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private failureThreshold = 5;
  private successThreshold = 2;
  private resetTimeoutMs = 30000; // 30 seconds

  constructor(config: Partial<CloudflareErrorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fetch with retry and fallback logic
   */
  async fetchWithFallback<T>(
    url: string,
    options: RequestInit = {},
    fallbackData?: T
  ): Promise<T> {
    let lastError: Error | null = null;

    // Try primary origin
    try {
      return await this.fetchWithRetry(url, options);
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Failed to fetch from primary origin: ${url}`, error);
    }

    // Try fallback origins
    for (const fallbackOrigin of this.config.fallbackOrigins) {
      try {
        const fallbackUrl = url.replace(new URL(url).origin, fallbackOrigin);
        logger.info(`Attempting fallback origin: ${fallbackUrl}`);
        return await this.fetchWithRetry(fallbackUrl, options);
      } catch (error) {
        logger.warn(`Failed to fetch from fallback origin: ${fallbackOrigin}`, error);
        lastError = error as Error;
      }
    }

    // Use cached/fallback data if available
    if (fallbackData !== undefined) {
      logger.warn(`Using fallback data for ${url}`);
      return fallbackData;
    }

    throw new Error(`All fetch attempts failed for ${url}: ${lastError?.message}`);
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(url: string, options: RequestInit = {}): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.config.enableCircuitBreaker) {
          this.checkCircuitBreaker(url);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          // Record success
          if (this.config.enableCircuitBreaker) {
            this.recordSuccess(url);
          }

          return data as T;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error as Error;

        // Record failure
        if (this.config.enableCircuitBreaker) {
          this.recordFailure(url);
        }

        if (attempt < this.config.maxRetries) {
          const delayMs = this.config.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          logger.warn(`Retry attempt ${attempt}/${this.config.maxRetries} for ${url} in ${delayMs}ms`, error);
          await this.delay(delayMs);
        }
      }
    }

    throw lastError || new Error(`Failed to fetch from ${url} after ${this.config.maxRetries} attempts`);
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(url: string): void {
    const breaker = this.getOrCreateCircuitBreaker(url);

    if (breaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - (breaker.lastFailureTime?.getTime() || 0);
      if (timeSinceLastFailure > this.resetTimeoutMs) {
        breaker.state = 'half-open';
        breaker.successCount = 0;
        logger.info(`Circuit breaker for ${url} transitioning to half-open`);
      } else {
        throw new Error(`Circuit breaker is open for ${url}`);
      }
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(url: string): void {
    const breaker = this.getOrCreateCircuitBreaker(url);

    if (breaker.state === 'half-open') {
      breaker.successCount++;
      if (breaker.successCount >= this.successThreshold) {
        breaker.state = 'closed';
        breaker.failureCount = 0;
        breaker.successCount = 0;
        logger.info(`Circuit breaker for ${url} closed`);
      }
    } else if (breaker.state === 'closed') {
      breaker.failureCount = Math.max(0, breaker.failureCount - 1);
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(url: string): void {
    const breaker = this.getOrCreateCircuitBreaker(url);
    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    if (breaker.failureCount >= this.failureThreshold) {
      breaker.state = 'open';
      logger.error(`Circuit breaker for ${url} opened after ${breaker.failureCount} failures`);
    }
  }

  /**
   * Get or create circuit breaker for URL
   */
  private getOrCreateCircuitBreaker(url: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(url)) {
      this.circuitBreakers.set(url, {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
      });
    }
    return this.circuitBreakers.get(url)!;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(url?: string) {
    if (url) {
      return this.circuitBreakers.get(url);
    }
    return Object.fromEntries(this.circuitBreakers);
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(url: string): void {
    this.circuitBreakers.delete(url);
    logger.info(`Circuit breaker reset for ${url}`);
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.clear();
    logger.info('All circuit breakers reset');
  }
}

// Export singleton instance
export const cloudflareErrorHandler = new CloudflareErrorHandler({
  maxRetries: 3,
  retryDelayMs: 1000,
  fallbackOrigins: process.env.CLOUDFLARE_FALLBACK_ORIGINS?.split(',') || [],
  timeoutMs: 5000,
  enableCircuitBreaker: true,
});
