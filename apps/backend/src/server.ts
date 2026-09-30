// apps/backend/src/server.ts
import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDB } from './db/connection';
import { connectRedis } from './cache/redis';

let server: http.Server | undefined;

async function bootstrap() {
  logger.info('🚀 Initializing PerfectPic Enterprise Backend Engine...');

  // 1. Connect to Database (MongoDB Atlas / local)
  try {
    await connectDB();
  } catch (err: any) {
    logger.warn(`Database initialization warning: ${err.message}`);
  }

  // 2. Connect to Cache (Redis)
  try {
    await connectRedis();
  } catch (err: any) {
    logger.warn(`Redis cache warning: ${err.message}`);
  }

  // 3. Ensure AWS S3 Bucket CORS rules are active
  try {
    const { isS3Configured, ensureS3Cors } = await import('./lib/s3');
    if (isS3Configured()) {
      await ensureS3Cors();
      logger.info('☁️ AWS S3 Bucket CORS verified and active for client canvas rendering.');
    }
  } catch (err: any) {
    logger.warn(`S3 CORS setup notice: ${err.message}`);
  }

  // 4. Start HTTP server
  server = app.listen(env.PORT, () => {
    logger.info(`✨ PerfectPic Server is live and listening on http://localhost:${env.PORT}`);
    logger.info(`🌐 Environment: ${env.NODE_ENV}`);
    logger.info(`📡 API Version 1: http://localhost:${env.PORT}/api/v1`);
    logger.info(`🩺 Health check: http://localhost:${env.PORT}/api/health`);
  });

  // Handle termination signals
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down PerfectPic server...`);
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed successfully.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled rejections and exceptions
  process.on('unhandledRejection', (reason: any) => {
    logger.error('💥 Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('💥 Uncaught Exception:', error);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap failure:', err);
  process.exit(1);
});

export { server };
export default server;
