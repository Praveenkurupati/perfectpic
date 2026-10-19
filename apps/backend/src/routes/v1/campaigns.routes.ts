// apps/backend/src/routes/v1/campaigns.routes.ts
import { Router } from 'express';
import { CampaignController } from '../../controllers/CampaignController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Public unsubscribe endpoint (CAN-SPAM / IT Act compliant)
router.get('/unsubscribe', CampaignController.handleUnsubscribe);
router.post('/unsubscribe', CampaignController.handleUnsubscribe);

// Apply optionalAuth across all administrative campaign endpoints
router.use(optionalAuth);

// ── Campaigns ─────────────────────────────────────────────────────────────
router.get('/', CampaignController.listCampaigns);
router.post('/', CampaignController.createCampaign);
router.get('/variables', CampaignController.getVariables);
router.get('/providers', CampaignController.getProviders);
router.post('/test-send', CampaignController.testSend);

// Audience Estimator (Interactive Builder)
router.post('/audience/estimate', CampaignController.estimateAudienceFilter);
router.post('/audience/preview', CampaignController.previewAudienceFilter);

// Templates
router.get('/templates', CampaignController.listTemplates);
router.post('/templates', CampaignController.createTemplate);
router.put('/templates/:id', CampaignController.updateTemplate);
router.delete('/templates/:id', CampaignController.deleteTemplate);

// Saved Audiences
router.get('/saved-audiences', CampaignController.listSavedAudiences);
router.post('/saved-audiences', CampaignController.createSavedAudience);
router.delete('/saved-audiences/:id', CampaignController.deleteSavedAudience);

// Suppression Engine
router.get('/suppressions', CampaignController.listSuppressions);
router.post('/suppressions', CampaignController.addSuppression);
router.get('/suppressions/stats', CampaignController.getSuppressionStats);
router.delete('/suppressions/:identifier', CampaignController.removeSuppression);

// Single Campaign Operations
router.get('/:id', CampaignController.getCampaign);
router.put('/:id', CampaignController.updateCampaign);
router.post('/:id/audience/calculate', CampaignController.calculateAudience);
router.get('/:id/audience/preview', CampaignController.previewAudience);
router.post('/:id/schedule', CampaignController.scheduleCampaign);
router.post('/:id/launch', CampaignController.launchCampaign);
router.post('/:id/pause', CampaignController.pauseCampaign);
router.post('/:id/resume', CampaignController.resumeCampaign);
router.post('/:id/cancel', CampaignController.cancelCampaign);
router.post('/:id/retry', CampaignController.retryFailed);
router.post('/:id/duplicate', CampaignController.duplicateCampaign);
router.get('/:id/analytics', CampaignController.getAnalytics);
router.get('/:id/recipients', CampaignController.getRecipients);

export default router;
