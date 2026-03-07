/**
 * Degens¤Den — Security Middleware
 * Rate limiting, helmet headers, CORS, input sanitization
 */

import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

// 1. Rate Limiting
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: "Too many requests, please try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many login attempts, please try again in 1 hour" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const gameRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: "Too many game requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Security Headers via Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", "'unsafe-inline'",
        "https://checkout.stripe.com",
        "https://fonts.bunny.net",
        "https://fonts.googleapis.com",
      ],
      styleSrc: [
        "'self'", "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://fonts.bunny.net",
      ],
      imgSrc: ["'self'", "data:", "blob:", "https://*.stripe.com"],
      connectSrc: [
        "'self'",
        "wss://cloutscape.org", "ws://cloutscape.org",
        "wss://www.cloutscape.org", "ws://www.cloutscape.org",
        "ws://localhost:*", "wss://localhost:*",
        "https://api.stripe.com",
        "https://fonts.bunny.net",
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.bunny.net",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "data:",
      ],
      frameSrc: ["'self'", "https://checkout.stripe.com"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for Socket.IO in some browsers
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "no-referrer" },
});

// 3. CORS
export const corsOptions = cors({
  origin: [
    "https://cloutscape.org",
    "https://www.cloutscape.org",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    ...(process.env.CORS_ORIGINS?.split(",").map((o: string) => o.trim()) || []),
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
});

// 4. Input Sanitization — strip HTML tags from body/query/params
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  const clean = (obj: Record<string, unknown>) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = (obj[key] as string).replace(/[<>]/g, "");
      } else if (obj[key] && typeof obj[key] === "object") {
        clean(obj[key] as Record<string, unknown>);
      }
    }
  };
  if (req.body) clean(req.body);
  if (req.query) clean(req.query as Record<string, unknown>);
  if (req.params) clean(req.params);
  next();
};

// 5. Force HTTPS in production
export const forceHttps = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
};

// 6. Security Logger
export const securityLogger = (req: Request, _res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} — IP: ${ip}`);
  next();
};

// 7. Dev Route Auth Guard
export const devAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"] || req.headers["x-dev-token"];
  const devToken = process.env.DEV_TOKEN;

  if (!devToken) return next(); // No token configured — allow (with warning)

  const provided = typeof authHeader === "string"
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  if (provided === devToken) return next();

  return res.status(403).json({
    success: false,
    error: "Unauthorized: Developer access required",
  });
};
