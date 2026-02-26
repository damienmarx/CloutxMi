import * as dotenv from "dotenv";
import path from "path";

/**
 * Configuration Management System
 * Handles environment variables and application configuration
 */

// Load environment variables from .env file
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

/**
 * Configuration object
 */
export const config = {
  // Application
  app: {
    name: process.env.APP_NAME || "CloutScape",
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "localhost",
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000").split(","),
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/cloutscape",
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10", 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "10000", 10),
    enableLogging: process.env.DB_ENABLE_LOGGING === "true",
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    jwtExpiration: process.env.JWT_EXPIRATION || "7d",
    encryptionKey: process.env.ENCRYPTION_KEY || "your-encryption-key-32-chars-min",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),
    sessionSecret: process.env.SESSION_SECRET || "your-session-secret",
    cookieSecure: process.env.COOKIE_SECURE === "true",
    cookieHttpOnly: process.env.COOKIE_HTTP_ONLY !== "false",
    cookieSameSite: (process.env.COOKIE_SAME_SITE || "strict") as "strict" | "lax" | "none",
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "json",
    file: process.env.LOG_FILE || "logs/app.log",
    maxSize: parseInt(process.env.LOG_MAX_SIZE || "10485760", 10), // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || "10", 10),
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== "false",
  },

  // Rate Limiting
  rateLimiting: {
    enabled: process.env.RATE_LIMITING_ENABLED !== "false",
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    keyGenerator: process.env.RATE_LIMIT_KEY_GENERATOR || "ip",
  },

  // Email
  email: {
    enabled: process.env.EMAIL_ENABLED === "true",
    provider: process.env.EMAIL_PROVIDER || "smtp",
    from: process.env.EMAIL_FROM || "noreply@cloutscape.org",
    smtp: {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
    },
  },

  // Crypto Wallet
  crypto: {
    trustWalletAddress: process.env.TRUST_WALLET_ADDRESS || "goatgang@trust",
    supportedNetworks: (process.env.CRYPTO_NETWORKS || "ethereum,bsc,polygon").split(","),
    infuraKey: process.env.INFURA_KEY || "",
  },

  // Monitoring & Analytics
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || "",
    enableMetrics: process.env.ENABLE_METRICS === "true",
    metricsPort: parseInt(process.env.METRICS_PORT || "9090", 10),
  },

  // Feature Flags
  features: {
    emailVerificationRequired: process.env.EMAIL_VERIFICATION_REQUIRED === "true",
    twoFactorAuthEnabled: process.env.TWO_FACTOR_AUTH_ENABLED === "true",
    maintenanceMode: process.env.MAINTENANCE_MODE === "true",
    betaFeatures: process.env.BETA_FEATURES === "true",
  },

  // Game Configuration
  games: {
    minBet: parseFloat(process.env.GAME_MIN_BET || "0.01"),
    maxBet: parseFloat(process.env.GAME_MAX_BET || "10000"),
    houseEdge: parseFloat(process.env.GAME_HOUSE_EDGE || "0.02"), // 2%
  },

  // VIP Configuration
  vip: {
    enabledTiers: (process.env.VIP_ENABLED_TIERS || "bronze,silver,gold,platinum,diamond").split(","),
    cashbackEnabled: process.env.VIP_CASHBACK_ENABLED !== "false",
    bonusMultiplierEnabled: process.env.VIP_BONUS_MULTIPLIER_ENABLED !== "false",
  },
};

/**
 * Validate configuration
 */
export function validateConfig(): string[] {
  const errors: string[] = [];

  // Check required variables
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL environment variable is required");
  }

  if (config.security.jwtSecret === "your-secret-key-change-in-production") {
    errors.push("JWT_SECRET must be changed from default value in production");
  }

  if (config.security.encryptionKey.length < 32) {
    errors.push("ENCRYPTION_KEY must be at least 32 characters long");
  }

  if (config.app.environment === "production") {
    if (!process.env.SENTRY_DSN) {
      errors.push("SENTRY_DSN is recommended for production");
    }

    if (!config.security.cookieSecure) {
      errors.push("COOKIE_SECURE should be true in production");
    }
  }

  return errors;
}

/**
 * Get configuration value with type safety
 */
export function getConfig<T>(path: string, defaultValue?: T): T {
  const keys = path.split(".");
  let value: any = config;

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      return defaultValue as T;
    }
  }

  return value as T;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return config.app.environment === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return config.app.environment === "development";
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof config.features): boolean {
  return config.features[feature];
}

export default config;
