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

    const cid = req.correlationId;
    if (statusCode >= 500) {
      logger.error(logMsg, { cid, method, url: originalUrl, statusCode, duration, ip });
    } else if (statusCode >= 400) {
      logger.warn(logMsg, { cid, method, url: originalUrl, statusCode, duration, ip });
    } else {
      logger.http(logMsg, { cid, method, url: originalUrl, statusCode, duration });
    }
  });

  next();
}

export default requestLogger;
