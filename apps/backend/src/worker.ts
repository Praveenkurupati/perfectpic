// apps/backend/src/worker.ts
import { connectDB } from './db/connection';
import { connectRedis } from './cache/redis';
import { logger } from './utils/logger';
import { QueueManager } from './queues/QueueManager';

/**
 * Dedicated Background Worker Process Entrypoint (EA-02).
 * Runs independently from the Express HTTP API container to ensure
 * high-concurrency photo rendering and PDF compiling never starve API requests.
 */
async function startWorkerProcess() {
  logger.info('⚙️ Starting PerfectPic Dedicated Background Worker Process...');
  logger.info(`📦 Process PID: ${process.pid} | Node: ${process.version}`);

  // 1. Initialize MongoDB Connection
  try {
    await connectDB();
    logger.info('🍃 Worker database connectivity established.');
  } catch (dbErr: any) {
    logger.warn(`Worker database connectivity notice: ${dbErr?.message}`);
  }

  // 2. Initialize Redis Connection
  try {
    await connectRedis();
    logger.info('⚡ Worker Redis connection established.');
  } catch (redisErr: any) {
    logger.warn(`Worker Redis connection notice: ${redisErr?.message}`);
  }

  // 3. Register and bind BullMQ Workers
  const { printRenderWorker, preflightWorker, notificationWorker } = await import('./queues/workers');
  logger.info('🎯 Active Workers Registered:');
  logger.info(`   - Print Render Worker [concurrency=2, queue=print-render-queue]`);
  logger.info(`   - Preflight QA Worker [concurrency=4, queue=preflight-queue]`);
  logger.info(`   - Notification Worker [concurrency=5, queue=notification-queue]`);

  // 4. Heartbeat Monitor for Queue Stats
  const heartbeat = setInterval(async () => {
    try {
      const stats = await QueueManager.getAllStats();
      const waitingTotal = Object.values(stats).reduce((acc, q) => acc + q.waiting, 0);
      const activeTotal = Object.values(stats).reduce((acc, q) => acc + q.active, 0);
      logger.info(`💓 [Worker Heartbeat] Queue Backlog: waiting=${waitingTotal}, active=${activeTotal}`);
    } catch {}
  }, 60000);

  // 5. Graceful shutdown handler
  const shutdown = async (signal: string) => {
    logger.info(`🛑 Received ${signal}. Shutting down worker process gracefully...`);
    clearInterval(heartbeat);

    try {
      await Promise.all([
        printRenderWorker.close(),
        preflightWorker.close(),
        notificationWorker.close(),
      ]);
      logger.info('✅ All workers closed without dropping in-flight jobs.');
    } catch (err: any) {
      logger.error('Error during worker closure:', err?.message);
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startWorkerProcess().catch((err) => {
  logger.error('Fatal worker process failure:', err);
  process.exit(1);
});
