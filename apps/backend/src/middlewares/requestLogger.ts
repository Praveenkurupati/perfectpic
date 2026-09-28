// apps/backend/src/middlewares/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logMsg = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      logger.error(logMsg, { method, url: originalUrl, statusCode, duration, ip });
    } else if (statusCode >= 400) {
      logger.warn(logMsg, { method, url: originalUrl, statusCode, duration, ip });
    } else {
      logger.http(logMsg, { method, url: originalUrl, statusCode, duration });
    }
  });

  next();
}

export default requestLogger;
