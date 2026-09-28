// apps/backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, ITokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/apiError';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: ITokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token missing or invalid.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token!);
    req.user = payload;
    next();
  } catch (err: any) {
    return next(ApiError.unauthorized('Session expired or token invalid.'));
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Access restricted to administrators only.'));
  }
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyToken(token!);
    } catch {
      // Continue unauthenticated
    }
  }
  next();
}
