// apps/backend/src/routes/v1/analytics.routes.ts
import { Router } from 'express';
import { AnalyticsController } from '../../controllers/AnalyticsController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Ingestion: Ingest client-side telemetry events (public / beacon)
router.post('/events', AnalyticsController.ingestEvents);

// Behavior Analytics: Comprehensive non-login vs login analytics with filters
router.get('/behaviour', optionalAuth, AnalyticsController.getBehaviourAnalytics);

// Live Feed: Real-time user journey feed
router.get('/live-feed', optionalAuth, AnalyticsController.getLiveJourneys);

// Legacy Executive Dashboard stats
router.get('/dashboard', optionalAuth, AnalyticsController.getDashboardStats);

// Legacy Revenue Trend
router.get('/revenue', optionalAuth, AnalyticsController.getRevenueData);

export default router;
