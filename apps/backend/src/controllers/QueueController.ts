// apps/backend/src/controllers/QueueController.ts
import { Request, Response, NextFunction } from 'express';
import { QueueManager, printRenderQueue } from '../queues/QueueManager';
import { isRedisConnected } from '../cache/redis';
import { OrderRepository } from '../repositories/OrderRepository';
import { logger } from '../utils/logger';
import { JobStatus } from '../queues/types';

export class QueueController {
  /**
   * GET /api/v1/queues/stats
   * Telemetry stats across all BullMQ/Redis worker queues
   */
  public static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await QueueManager.getAllStats();
      const mem = process.memoryUsage();

      const memoryUsageMb = {
        rss: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
        heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
        heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      };

      const waitingTotal = Object.values(stats).reduce((acc, q) => acc + (q.waiting || 0), 0);
      const activeTotal = Object.values(stats).reduce((acc, q) => acc + (q.active || 0), 0);
      const failedTotal = Object.values(stats).reduce((acc, q) => acc + (q.failed || 0), 0);
      const completedTotal = Object.values(stats).reduce((acc, q) => acc + (q.completed || 0), 0);

      return res.status(200).json({
        success: true,
        isRedisConnected: isRedisConnected(),
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMb,
        totals: {
          waiting: waitingTotal,
          active: activeTotal,
          failed: failedTotal,
          completed: completedTotal,
        },
        queues: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/queues/jobs
   * Returns list of jobs for a specific queue with status filtering & pagination
   */
  public static async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const queueName = (req.query.queue as string) || 'print-render-queue';
      const statusParam = (req.query.status as string) || 'all';
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
      const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

      let statuses: JobStatus[] | undefined;
      if (statusParam !== 'all') {
        statuses = statusParam.split(',') as JobStatus[];
      }

      const jobs = await QueueManager.getQueueJobs(queueName, {
        statuses,
        limit,
        offset,
      });

      return res.status(200).json({
        success: true,
        queue: queueName,
        status: statusParam,
        count: jobs.length,
        jobs: jobs.map((j) => (j as any).toJSON ? (j as any).toJSON() : j),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/queues/retry/:id
   * Retries a failed or dead-letter queue (DLQ) job
   */
  public static async retryJob(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = String(req.params.id);
      const queueName = (req.body.queue as string) || (req.query.queue as string) || 'print-render-queue';

      const retried = await QueueManager.retryJob(queueName, jobId);
      if (!retried) {
        return res.status(404).json({
          success: false,
          error: `Job ${jobId} not found in ${queueName}`,
        });
      }

      logger.info(`[QueueController] Retried job ${jobId} in ${queueName}`);
      return res.status(200).json({
        success: true,
        message: `Job ${jobId} successfully retried from DLQ`,
        job: (retried as any).toJSON ? (retried as any).toJSON() : retried,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/queues/render-order/:orderId
   * Triggers or re-triggers 300 DPI print rendering for an order
   */
  public static async triggerOrderRender(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = String(req.params.orderId);
      const order = await OrderRepository.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: `Order ${orderId} not found` });
      }

      // Mark order in rendering status
      await OrderRepository.updateStatus(orderId, 'rendering', {
        notes: 'Print rendering triggered from Admin Command Center',
      });

      const correlationId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const job = await printRenderQueue.add('compile-print-pdf', {
        orderId,
        projectId: (order as any).projectId,
        customerEmail: (order as any).customerEmail,
        correlationId,
        options: {
          forceRender: true,
        },
      });

      logger.info(`[QueueController] Enqueued manual print render job ${job.id} for order ${orderId}`);
      return res.status(200).json({
        success: true,
        message: `Order ${orderId} 300 DPI render job queued`,
        jobId: job.id,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/queues/jobs/:id
   * Cancels / deletes a job from queue
   */
  public static async removeJob(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = String(req.params.id);
      const queueName = (req.query.queue as string) || 'print-render-queue';

      const removed = await QueueManager.removeJob(queueName, jobId);
      return res.status(200).json({
        success: removed,
        message: `Job ${jobId} removed from ${queueName}`,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default QueueController;
