// apps/backend/src/routes/v1/anniversary.routes.ts
import { Router } from 'express';
import { AnniversaryController } from '../../controllers/AnniversaryController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Apply optionalAuth across all anniversary endpoints
router.use(optionalAuth);

// GET /api/v1/anniversary/upcoming - List orders with upcoming milestones & calculated drip stages
router.get('/upcoming', AnniversaryController.getUpcoming);

// GET /api/v1/anniversary/metrics - High-level CRM retention, conversion & repeat revenue metrics
router.get('/metrics', AnniversaryController.getMetrics);

// GET /api/v1/anniversary/preview/:orderId - Preview personalized WhatsApp & Email templates for an order
router.get('/preview/:orderId', AnniversaryController.previewTemplates);

// POST /api/v1/anniversary/trigger/:orderId - Manually dispatch multi-channel reminder for a specific order
router.post('/trigger/:orderId', AnniversaryController.triggerReminder);

// POST /api/v1/anniversary/sweep - Admin 1-click trigger to execute the daily milestone sweep immediately
router.post('/sweep', AnniversaryController.processSweep);

export default router;
