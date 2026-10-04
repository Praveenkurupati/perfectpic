import { Router } from 'express';
import { AnalyticsController } from '../../controllers/AnalyticsController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// Ingestion: Ingest client-side telemetry events (public / beacon)
router.post('/events', AnalyticsController.ingestEvents);

// Meta Conversions API (CAPI) direct relay endpoint
router.post('/meta-capi', AnalyticsController.relayMetaCapi);

// Behavior Analytics: Comprehensive non-login vs login analytics with filters (Admin only)
router.get('/behaviour', authenticate, adminOnly, AnalyticsController.getBehaviourAnalytics);

// Live Feed: Real-time user journey feed (Admin only)
router.get('/live-feed', authenticate, adminOnly, AnalyticsController.getLiveJourneys);

// Executive Dashboard stats (Admin only)
router.get('/dashboard', authenticate, adminOnly, AnalyticsController.getDashboardStats);

// Revenue Trend (Admin only)
router.get('/revenue', authenticate, adminOnly, AnalyticsController.getRevenueData);

export default router;
