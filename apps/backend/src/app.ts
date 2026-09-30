// apps/backend/src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import apiRouter from './routes';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Cross-origin resource sharing
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    env.FRONTEND_URL,
    env.ADMIN_URL,
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || env.CORS_ORIGIN === '*') {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Structured HTTP request logger with execution timer
  app.use(requestLogger);

  // Body parsers with 50mb payload limit for high-res photo uploads and canvas JSON
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static uploads directory serving with permissive cross-origin headers
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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

  // Master API router (serves /api/health, /api/v1/*, and /api/*)
  app.use('/api', apiRouter);

  // 404 handler for unrecognized routes
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
