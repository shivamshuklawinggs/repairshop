import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
const enabled= process.env.RATE_LIMITING === "true"
interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

/**
 * Reusable Rate Limiter
 * Runs ONLY when enabled = true
 */
export const createRateLimiter = (options: RateLimiterOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 min
    max = 100,
    message = "Too many requests, please try again later.",
  } = options;

  // If disabled → return no-op middleware
  if (!enabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      error: "RATE_LIMIT_EXCEEDED",
      message,
    },
  }) as RateLimitRequestHandler;
};
