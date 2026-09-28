// apps/backend/src/routes/index.ts
import { Router } from 'express';
import v1Routes from './v1';
import { isDbConnected } from '../db/connection';
import { isRedisConnected } from '../cache/redis';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      mongodb: isDbConnected() ? 'connected' : 'in-memory-fallback',
      redis: isRedisConnected() ? 'connected' : 'cache-bypass-active',
    },
  });
});

// Primary Versioned API Routes (/api/v1/*)
apiRouter.use('/v1', v1Routes);

// Backward Compatibility Routes (/api/*)
apiRouter.use('/', v1Routes);

export default apiRouter;
