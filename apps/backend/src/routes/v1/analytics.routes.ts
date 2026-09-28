// apps/backend/src/routes/v1/analytics.routes.ts
import { Router } from 'express';
import { AnalyticsController } from '../../controllers/AnalyticsController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// GET /api/v1/analytics/dashboard
router.get('/dashboard', optionalAuth, AnalyticsController.getDashboardStats);

// GET /api/v1/analytics/revenue
router.get('/revenue', optionalAuth, AnalyticsController.getRevenueData);

export default router;
