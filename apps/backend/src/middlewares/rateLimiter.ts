// apps/backend/src/middlewares/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet, isRedisConnected } from '../cache/redis';
import { ApiError } from '../utils/apiError';

interface RateLimitStoreEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitStoreEntry>();

// Clean up stale entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetAt) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  prefix?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP, please try again later.',
    prefix = 'rl',
  } = options;

  return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract client IP address safely
      const forwarded = req.headers['x-forwarded-for'];
      const rawIp = (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : req.socket.remoteAddress) || '127.0.0.1';
      const ip = rawIp.replace(/[^a-zA-Z0-9.:_-]/g, '');
      const key = `${prefix}:${ip}`;
      const now = Date.now();

      // 1. Redis-backed rate limiting (distributed)
      if (isRedisConnected()) {
        const cached = await cacheGet<RateLimitStoreEntry>(key);
        if (cached && now < cached.resetAt) {
          if (cached.count >= max) {
            const retryAfterSec = Math.ceil((cached.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', 0);
            return next(ApiError.tooManyRequests(message));
          }
          cached.count += 1;
          const ttlSec = Math.ceil((cached.resetAt - now) / 1000);
          await cacheSet(key, cached, ttlSec);
          res.setHeader('X-RateLimit-Limit', max);
          res.setHeader('X-RateLimit-Remaining', Math.max(0, max - cached.count));
          return next();
        } else {
          const entry: RateLimitStoreEntry = {
            count: 1,
            resetAt: now + windowMs,
          };
          await cacheSet(key, entry, Math.ceil(windowMs / 1000));
          res.setHeader('X-RateLimit-Limit', max);
          res.setHeader('X-RateLimit-Remaining', max - 1);
          return next();
        }
      }

      // 2. In-memory fallback
      const entry = memoryStore.get(key);
      if (entry && now < entry.resetAt) {
        if (entry.count >= max) {
          const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
          res.setHeader('Retry-After', retryAfterSec);
          res.setHeader('X-RateLimit-Limit', max);
          res.setHeader('X-RateLimit-Remaining', 0);
          return next(ApiError.tooManyRequests(message));
        }
        entry.count += 1;
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
        return next();
      }

      const newEntry: RateLimitStoreEntry = {
        count: 1,
        resetAt: now + windowMs,
      };
      memoryStore.set(key, newEntry);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    } catch {
      // In case of rate limiter store failure, fail open to avoid service outage
      next();
    }
  };
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 attempts per minute per IP
  message: 'Too many authentication attempts. Please wait a minute before trying again.',
  prefix: 'rl:auth',
});

export const orderRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30, // 30 orders/payment creations per minute per IP
  message: 'Rate limit exceeded. Please wait a moment before trying again.',
  prefix: 'rl:order',
});

export const globalApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 600, // 600 requests per minute per IP
  message: 'API rate limit exceeded. Please wait a moment before making more requests.',
  prefix: 'rl:global',
});
