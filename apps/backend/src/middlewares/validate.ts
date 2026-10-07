// apps/backend/src/middlewares/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/apiError';

/**
 * Express middleware to validate request bodies against Zod schemas.
 * Enforces runtime boundary validation, eliminates malformed payloads,
 * and attaches sanitized typed data to req.body.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const issues = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          rule: e.code,
        }));
        return next(ApiError.badRequest('Request body schema validation failed.', issues));
      }
      next(err);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const issues = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          rule: e.code,
        }));
        return next(ApiError.badRequest('Request query schema validation failed.', issues));
      }
      next(err);
    }
  };
}

export default validateBody;
