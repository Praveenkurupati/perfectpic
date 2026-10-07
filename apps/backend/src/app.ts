// apps/backend/src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { correlationMiddleware } from './middlewares/correlation.middleware';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { logger } from './utils/logger';
import { globalApiRateLimiter } from './middlewares/rateLimiter';
import { csrfProtection } from './middlewares/csrf.middleware';
import apiRouter from './routes';

export function createApp(): Application {
  const app = express();

  // Security headers: Clickjacking defense, MIME sniffing prevention, hide X-Powered-By
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: { action: 'sameorigin' },
      noSniff: true,
      hidePoweredBy: true,
      xssFilter: true,
    })
  );

  // Cross-origin resource sharing
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://perfectpic.in',
    'https://www.perfectpic.in',
    'https://admin.perfectpic.in',
    env.FRONTEND_URL,
    env.ADMIN_URL,
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile native apps, curl, Postman, server-to-server)
        if (!origin) return callback(null, true);

        if (env.CORS_ORIGIN === '*' || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Allow any perfectpic.in subdomains
        try {
          const parsed = new URL(origin);
          if (parsed.hostname === 'perfectpic.in' || parsed.hostname.endsWith('.perfectpic.in')) {
            return callback(null, true);
          }
        } catch {}

        if (env.isDev) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-correlation-id', 'X-Correlation-Id', 'x-request-id'],
      exposedHeaders: ['x-correlation-id'],
    })
  );

  // Distributed correlation ID injection
  app.use(correlationMiddleware);

  // Structured HTTP request logger with execution timer
  app.use(requestLogger);

  // Body parsers with 50mb payload limit for high-res photo uploads and canvas JSON
  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CSRF protection on state-changing mutation routes (SEC-03)
  app.use(csrfProtection);

  // Static uploads directory serving with permissive cross-origin headers
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (err: any) {
    logger.warn(`Could not create uploads directory at ${uploadsDir}: ${err?.message}`);
  }
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    })
  );

  // Welcome route
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'PerfectPic Core API',
      version: '1.0.0',
      status: 'operational',
      documentation: '/api/v1',
      health: '/api/health',
    });
  });

  // Master API router protected with global volumetric rate limiter
  app.use('/api', globalApiRateLimiter, apiRouter);

  // 404 handler for unrecognized routes
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
