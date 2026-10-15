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

// Command Center Master Intelligence (Admin only)
router.get('/command-center', authenticate, adminOnly, AnalyticsController.getCommandCenterStats);

// SLA Operational Intelligence & Stage Risk (Admin only)
router.get('/sla', authenticate, adminOnly, AnalyticsController.getSlaMetrics);

// Attention Required Center Alerts (Admin only)
router.get('/alerts', authenticate, adminOnly, AnalyticsController.getAlerts);

// Financial Decomposition & 4-Tier Unit Economics (Admin only)
router.get('/financials', authenticate, adminOnly, AnalyticsController.getFinancials);

// 9-Step Photobook Conversion Funnel & Drop-off (Admin only)
router.get('/funnel', authenticate, adminOnly, AnalyticsController.getFunnelAnalytics);

// Daily Business Summary (Admin only)
router.get('/daily-summary', authenticate, adminOnly, AnalyticsController.getDailySummary);

// Revenue Trend (Admin only)
router.get('/revenue', authenticate, adminOnly, AnalyticsController.getRevenueData);

export default router;
