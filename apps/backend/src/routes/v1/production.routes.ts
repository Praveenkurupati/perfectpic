import { Router } from 'express';
import { ProductionController } from '../../controllers/ProductionController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// Get kanban production queue columns and metrics - Admin only
router.get('/', authenticate, adminOnly, ProductionController.getQueue);

// Advance item status through the fulfillment queue - Admin only
router.put('/:orderId/status', authenticate, adminOnly, ProductionController.advance);

export default router;
