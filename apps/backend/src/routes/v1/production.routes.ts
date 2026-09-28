// apps/backend/src/routes/v1/production.routes.ts
import { Router } from 'express';
import { ProductionController } from '../../controllers/ProductionController';

const router = Router();

// Get kanban production queue columns and metrics
router.get('/', ProductionController.getQueue);

// Advance item status through the fulfillment queue
router.put('/:orderId/status', ProductionController.advance);

export default router;
