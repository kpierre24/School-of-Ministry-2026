import { Request, Response, NextFunction } from "express";
import { logger } from "../../lib/logger";

/**
 * In-memory sliding window rate limiter
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipLimits = new Map<string, RateLimitRecord>();

// Clean up stale rate limit records every 10 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipLimits.entries()) {
    if (now > record.resetTime) {
      ipLimits.delete(ip);
    }
  }
}, 10 * 60 * 1000);

if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

/**
 * Rate Limiting Middleware
 * Defaults to max 100 requests per 15 minutes per IP address.
 */
export function rateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();

    let record = ipLimits.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipLimits.set(clientIp, record);
    } else {
      record.count += 1;
    }

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      logger.warn(`Rate limit exceeded for IP: ${clientIp} on endpoint: ${req.originalUrl}`);
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * HTTP Security Headers Middleware
 * Appends industry-standard protective HTTP response headers.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self)");
  next();
}

/**
 * Sanitizes input text to prevent XSS payloads in request body
 */
function sanitizeString(str: string): string {
  return str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/**
 * Recursively sanitizes user input in string values of JSON body
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (obj !== null && typeof obj === "object") {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = sanitizeObject(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Request Body Sanitization Middleware
 */
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Validates repository URL for git cloning
 */
export function isValidGitUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  // Strictly enforce valid GitHub HTTPS repository URLs
  const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?$/;
  return githubPattern.test(url.trim());
}
