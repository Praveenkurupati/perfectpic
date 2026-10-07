// apps/backend/src/middlewares/correlation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend Express Request type to carry correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Middleware that extracts or generates a distributed correlation ID (x-correlation-id)
 * and propagates it to response headers and request context.
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = (
    req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    req.headers['correlation-id']
  ) as string | undefined;

  const correlationId = incoming && incoming.trim().length > 0
    ? incoming.trim()
    : `cid_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  next();
}

export default correlationMiddleware;
