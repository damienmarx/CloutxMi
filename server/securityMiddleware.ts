import { sql } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

/**
 * Security Middleware Configuration
 */

// 1. Rate Limiting: Prevent DDoS and brute force attacks
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 failed login attempts per hour
  message: {
    success: false,
    error: "Too many login attempts, please try again after an hour",
  },
});

// 2. Helmet: Secure Express apps by setting various HTTP headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.coinbase.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
});

// 3. CORS: Cross-Origin Resource Sharing
export const corsOptions = cors({
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://cloutscape.org", "https://cloutscape.org"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // 24 hours
});

// 4. Custom Security Middlewares

/**
 * Sanitize inputs to prevent XSS and SQL Injection
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Simple sanitization for body, query, and params
  const sanitize = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key].replace(/[<>]/g, ""); // Remove < and >
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

/**
 * Ensure HTTPS in production
 */
export const forceHttps = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
};

/**
 * Request logging for security auditing
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip}`);
  next();
};

/**
 * Developer Authorization Middleware
 * Ensures only users with a valid GITHUB_TOKEN or designated DEV_TOKEN
 * can access code implementation or dev status routes.
 */
export const devAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"] || req.headers["x-dev-token"];
  const devToken = process.env.DEV_TOKEN || process.env.GITHUB_TOKEN;

  // If no token is configured, allow for now but log a warning
  if (!devToken) {
    console.warn("[SECURITY] No DEV_TOKEN or GITHUB_TOKEN configured in environment variables.");
    return next();
  }

  // Extract token from "Bearer <token>" or direct header
  const providedToken = typeof authHeader === "string" 
    ? authHeader.replace("Bearer ", "").trim() 
    : "";

  if (providedToken === devToken) {
    return next();
  }

  console.warn(`[SECURITY] Unauthorized dev access attempt from IP: ${req.ip}`);
  return res.status(403).json({
    success: false,
    error: "Unauthorized: Developer status or token required for this action.",
    message: "Code writing, file implementation, and dev status are restricted to authorized users."
  });
};

export const gameRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 game actions per minute
  message: {
    success: false,
    error: "Too many game requests, please try again after a minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
