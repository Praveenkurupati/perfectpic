// apps/backend/src/routes/v1/queues.routes.ts
import { Router } from 'express';
import { QueueController } from '../../controllers/QueueController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// GET /api/v1/queues/stats - Worker queues telemetry & system health
router.get('/stats', authenticate, adminOnly, QueueController.getStats);

// GET /api/v1/queues/jobs - List queue jobs by status & queue
router.get('/jobs', authenticate, adminOnly, QueueController.getJobs);

// POST /api/v1/queues/retry/:id - Retry a failed / DLQ job
router.post('/retry/:id', authenticate, adminOnly, QueueController.retryJob);

// POST /api/v1/queues/render-order/:orderId - Trigger 300 DPI press render
router.post('/render-order/:orderId', authenticate, adminOnly, QueueController.triggerOrderRender);

// DELETE /api/v1/queues/jobs/:id - Cancel or delete a job
router.delete('/jobs/:id', authenticate, adminOnly, QueueController.removeJob);

export default router;
