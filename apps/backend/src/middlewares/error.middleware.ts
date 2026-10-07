// apps/backend/src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let message = 'An unexpected server error occurred';
  let errorCode = 'INTERNAL_ERROR';
  let details: any = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Mongoose or Zod validation error
    statusCode = 400;
    message = err.message || 'Validation error';
    errorCode = 'VALIDATION_ERROR';
    details = err.errors;
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'A record with this unique identifier already exists.';
    errorCode = 'DUPLICATE_KEY';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token.';
    errorCode = 'INVALID_TOKEN';
  } else if (err.message) {
    message = err.message;
  }

  if (statusCode >= 500) {
    const { ObservabilityService } = require('../services/ObservabilityService');
    ObservabilityService.captureException(err, {
      source: 'api',
      correlationId: req.correlationId,
      extra: {
        url: req.originalUrl,
        method: req.method,
      },
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
    },
  });
}
