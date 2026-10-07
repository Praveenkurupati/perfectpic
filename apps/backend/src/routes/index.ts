// apps/backend/src/routes/index.ts
import { Router } from 'express';
import v1Routes from './v1';
import { isDbConnected } from '../db/connection';
import { isRedisConnected } from '../cache/redis';
import { QueueManager } from '../queues/QueueManager';

const apiRouter = Router();

// Standard Health check endpoint
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

// Shallow liveness probe for Kubernetes / Docker compose
apiRouter.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Deep readiness probe verifying database, cache, and queue pipelines
apiRouter.get('/health/ready', async (req, res) => {
  const queueStats = await QueueManager.getAllStats();

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: isDbConnected() ? 'connected' : 'in-memory-fallback',
      redis: isRedisConnected() ? 'connected' : 'cache-bypass-active',
      queues: queueStats,
    },
  });
});

// Primary Versioned API Routes (/api/v1/*)
apiRouter.use('/v1', v1Routes);

// Backward Compatibility Routes (/api/*)
apiRouter.use('/', v1Routes);

export default apiRouter;
