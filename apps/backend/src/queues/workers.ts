// apps/backend/src/queues/workers.ts
import { Worker } from './QueueManager';
import { PrintEngineService } from '../services/PrintEngineService';
import { OrderRepository } from '../repositories/OrderRepository';
import { mailService } from '../services/MailService';
import { logger } from '../utils/logger';

// ── 1. Print Render Worker ──────────────────────────────────────────────────
export const printRenderWorker = new Worker<{
  orderId: string;
  projectId?: string;
  customerEmail?: string;
  options?: any;
}>(
  'print-render-queue',
  async (job) => {
    logger.info(`[Worker:printRender] Starting 300 DPI compile for Order ${job.data.orderId} (Job ${job.id})`);
    await job.updateProgress(15);

    // Step 1: Compile 300 DPI Press Master with bleed and layflat spreads
    const { pdfBuffer, preflight } = await PrintEngineService.compileOrderPressPdf(job.data.orderId);
    await job.updateProgress(65);

    // Step 2: Store / Update Order Record with generated press PDF metadata
    const orderId = job.data.orderId;
    const generatedPdfUrl = `/api/v1/orders/${orderId}/invoice`; // S3 or binary download URL

    try {
      await OrderRepository.updateStatus(orderId, 'printing', {
        notes: `300 DPI Press Master rasterized via PrintEngine (Score: ${preflight.score}/100, Bytes: ${pdfBuffer.length})`,
      });
      await (OrderRepository as any).update?.(orderId, {
        printPdfUrl: generatedPdfUrl,
        productionStage: 'printing',
      });
    } catch (orderUpdateErr: any) {
      logger.warn(`[Worker:printRender] Could not update order record: ${orderUpdateErr?.message}`);
    }
    await job.updateProgress(90);

    // Step 3: Optional customer confirmation notification
    if (job.data.customerEmail) {
      try {
        const order = await OrderRepository.findById(orderId);
        if (order) {
          await mailService.sendOrderConfirmationEmail(job.data.customerEmail, order);
        }
      } catch (mailErr: any) {
        logger.warn(`[Worker:printRender] Notification warning: ${mailErr?.message}`);
      }
    }

    await job.updateProgress(100);
    logger.info(`[Worker:printRender] Successfully completed 300 DPI press master for Order ${orderId}`);
    return {
      orderId,
      pdfSizeBytes: pdfBuffer.length,
      preflightScore: preflight.score,
      preflightPassed: preflight.passed,
    };
  },
  { concurrency: 2 }
);

// ── 2. Preflight Quality Assurance Worker ───────────────────────────────────
export const preflightWorker = new Worker<{
  projectId: string;
  photoUrls: string[];
  dimensions?: string;
  pageCount?: number;
}>(
  'preflight-queue',
  async (job) => {
    logger.info(`[Worker:preflight] Auditing project ${job.data.projectId} (Job ${job.id})`);
    await job.updateProgress(30);

    const pageCount = job.data.pageCount || 40;
    const report = PrintEngineService.auditPreflight(pageCount, {
      dimensions: job.data.dimensions || '8.25x8.25',
    });

    await job.updateProgress(100);
    return report;
  },
  { concurrency: 4 }
);

// ── 3. Notification Worker ──────────────────────────────────────────────────
export const notificationWorker = new Worker<{
  type: 'order_confirmation' | 'otp' | 'shipping_update';
  recipient: string;
  payload: any;
}>(
  'notification-queue',
  async (job) => {
    logger.info(`[Worker:notification] Processing ${job.data.type} to ${job.data.recipient}`);
    await job.updateProgress(50);

    if (job.data.type === 'order_confirmation') {
      await mailService.sendOrderConfirmationEmail(job.data.recipient, job.data.payload);
    }

    await job.updateProgress(100);
    return { dispatched: true, recipient: job.data.recipient };
  },
  { concurrency: 5 }
);
