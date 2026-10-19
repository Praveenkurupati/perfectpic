// apps/backend/src/controllers/CampaignController.ts
import { Request, Response } from 'express';
import { CampaignService } from '../services/communication/CampaignService';
import { AudienceFilterEngine, IAudienceFilter } from '../services/communication/AudienceFilterEngine';
import { SuppressionService } from '../services/communication/SuppressionService';
import { TemplateVariableRegistry } from '../services/communication/TemplateVariableRegistry';
import { ProviderRegistry } from '../services/communication/providers/ProviderRegistry';
import { logger } from '../utils/logger';

export class CampaignController {
  // ── 1. Campaigns Lifecycle & CRUD ──────────────────────────────────────────

  public static async listCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const channel = req.query.channel as string;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await CampaignService.listCampaigns({ channel, status, search, page, limit });
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error('Error listing campaigns:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async getCampaign(req: Request, res: Response): Promise<void> {
    try {
      const campaign = await CampaignService.getCampaignById(String(req.params.id));
      if (!campaign) {
        res.status(404).json({ success: false, error: 'Campaign not found' });
        return;
      }
      res.status(200).json({ success: true, campaign });
    } catch (err: any) {
      logger.error('Error fetching campaign:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const campaign = await CampaignService.createCampaign(req.body, user);
      res.status(201).json({ success: true, campaign });
    } catch (err: any) {
      logger.error('Error creating campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const campaign = await CampaignService.updateCampaign(String(req.params.id), req.body, user);
      res.status(200).json({ success: true, campaign });
    } catch (err: any) {
      logger.error('Error updating campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async calculateAudience(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const result = await CampaignService.calculateAudience(String(req.params.id), user);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error('Error calculating audience for campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async previewAudience(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const preview = await CampaignService.previewRecipients(String(req.params.id), limit);
      res.status(200).json({ success: true, preview });
    } catch (err: any) {
      logger.error('Error previewing audience for campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async scheduleCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { scheduledAt } = req.body;
      if (!scheduledAt) {
        res.status(400).json({ success: false, error: 'scheduledAt timestamp is required' });
        return;
      }
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const campaign = await CampaignService.scheduleCampaign(String(req.params.id), new Date(scheduledAt), user);
      res.status(200).json({ success: true, campaign });
    } catch (err: any) {
      logger.error('Error scheduling campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async launchCampaign(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const campaign = await CampaignService.launchCampaign(String(req.params.id), user);
      res.status(200).json({ success: true, campaign });
    } catch (err: any) {
      logger.error('Error launching campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async pauseCampaign(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const campaign = await CampaignService.pauseCampaign(String(req.params.id), user);
      res.status(200).json({ success: true, campaign });
    } catch (err: any) {
      logger.error('Error pausing campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async resumeCampaign(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const campaign = await CampaignService.resumeCampaign(String(req.params.id), user);
      res.status(200).json({ success: true, campaign });
    } catch (err: any) {
      logger.error('Error resuming campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async cancelCampaign(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const campaign = await CampaignService.cancelCampaign(String(req.params.id), user);
      res.status(200).json({ success: true, campaign });
    } catch (err: any) {
      logger.error('Error cancelling campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async retryFailed(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const result = await CampaignService.retryFailedRecipients(String(req.params.id), user);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error('Error retrying failed recipients:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async duplicateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const duplicate = await CampaignService.duplicateCampaign(String(req.params.id), user);
      res.status(201).json({ success: true, campaign: duplicate });
    } catch (err: any) {
      logger.error('Error duplicating campaign:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await CampaignService.getCampaignAnalytics(String(req.params.id));
      res.status(200).json({ success: true, analytics });
    } catch (err: any) {
      logger.error('Error fetching campaign analytics:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async getRecipients(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string;
      const search = req.query.search as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const result = await CampaignService.getCampaignRecipients(String(req.params.id), { status, search, page, limit });
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error('Error fetching campaign recipients:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async testSend(req: Request, res: Response): Promise<void> {
    try {
      const result = await CampaignService.testSend(req.body);
      res.status(200).json({ success: true, result });
    } catch (err: any) {
      logger.error('Error executing test send:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // ── 2. Ad-Hoc Audience Estimator (for interactive Filter Builder) ───────────

  public static async estimateAudienceFilter(req: Request, res: Response): Promise<void> {
    try {
      const filter = req.body.filter || {};
      const channel = req.body.channel || 'email';
      const result = await AudienceFilterEngine.estimateAudience(filter, channel);
      res.status(200).json({ success: true, result });
    } catch (err: any) {
      logger.error('Error estimating audience filter:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async previewAudienceFilter(req: Request, res: Response): Promise<void> {
    try {
      const filter = req.body.filter || {};
      const channel = req.body.channel || 'email';
      const limit = req.body.limit ? Number(req.body.limit) : 10;
      const preview = await AudienceFilterEngine.previewAudience(filter, channel, limit);
      res.status(200).json({ success: true, preview });
    } catch (err: any) {
      logger.error('Error previewing audience filter:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // ── 3. Templates API ────────────────────────────────────────────────────────

  public static async listTemplates(req: Request, res: Response): Promise<void> {
    try {
      const channel = req.query.channel as string;
      const category = req.query.category as string;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await CampaignService.listTemplates({ channel, category, status, search, page, limit });
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error('Error listing templates:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const template = await CampaignService.createTemplate(req.body, user);
      res.status(201).json({ success: true, template });
    } catch (err: any) {
      logger.error('Error creating template:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = await CampaignService.updateTemplate(String(req.params.id), req.body);
      res.status(200).json({ success: true, template });
    } catch (err: any) {
      logger.error('Error updating template:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      await CampaignService.deleteTemplate(String(req.params.id));
      res.status(200).json({ success: true, message: 'Template removed successfully' });
    } catch (err: any) {
      logger.error('Error deleting template:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 4. Saved Audiences API ──────────────────────────────────────────────────

  public static async listSavedAudiences(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await CampaignService.listSavedAudiences({ search, page, limit });
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error('Error listing saved audiences:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async createSavedAudience(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user?.name || (req as any).user?.email || 'Admin';
      const audience = await CampaignService.saveAudience(req.body, user);
      res.status(201).json({ success: true, audience });
    } catch (err: any) {
      logger.error('Error creating saved audience:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async deleteSavedAudience(req: Request, res: Response): Promise<void> {
    try {
      await CampaignService.deleteSavedAudience(String(req.params.id));
      res.status(200).json({ success: true, message: 'Saved audience removed successfully' });
    } catch (err: any) {
      logger.error('Error deleting saved audience:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 5. Suppression Management & Public Unsubscribe ─────────────────────────

  public static async listSuppressions(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string;
      const channel = req.query.channel as string;
      const reason = req.query.reason as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const result = await SuppressionService.listSuppressions({ search, channel, reason, page, limit });
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error('Error listing suppressions:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async addSuppression(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, channel, reason, notes, expiresAt } = req.body;
      if (!identifier || !channel || !reason) {
        res.status(400).json({ success: false, error: 'identifier, channel, and reason are required' });
        return;
      }
      const entry = await SuppressionService.suppress({
        identifier,
        channel,
        reason,
        notes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      res.status(201).json({ success: true, entry });
    } catch (err: any) {
      logger.error('Error adding suppression:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static async removeSuppression(req: Request, res: Response): Promise<void> {
    try {
      const identifier = String(req.params.identifier);
      const channel = (req.query.channel as any) || 'all';
      const removed = await SuppressionService.unsuppress(identifier, channel);
      res.status(200).json({ success: true, removed });
    } catch (err: any) {
      logger.error('Error removing suppression:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async getSuppressionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await SuppressionService.getStats();
      res.status(200).json({ success: true, stats });
    } catch (err: any) {
      logger.error('Error fetching suppression stats:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async handleUnsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const email = req.query.email as string || req.body.email as string;
      const channel = (req.query.channel as string || req.body.channel as string || 'email') as any;

      if (!email) {
        res.status(400).send('<h3>Invalid Request: Email parameter missing</h3>');
        return;
      }

      await SuppressionService.suppress({
        identifier: email,
        channel,
        reason: 'unsubscribed',
        source: 'user_unsubscribe_link',
        notes: 'Unsubscribed via email link',
      });

      if (req.accepts('html')) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Unsubscribed — PerfectPic</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf8f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #fff; padding: 40px; border-radius: 8px; border: 1px solid #e7e2d9; max-width: 480px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
              h1 { font-family: Georgia, serif; color: #1c1917; margin-bottom: 12px; font-size: 24px; }
              p { color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
              .tag { background: #f5f5f4; color: #44403c; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>You have been unsubscribed</h1>
              <p>We've successfully removed <span class="tag">${email}</span> from our promotional communication lists. You will no longer receive marketing messages.</p>
              <p style="font-size: 13px; color: #a8a29e;">Transactional order receipts and shipping notifications will continue to be delivered safely.</p>
            </div>
          </body>
          </html>
        `);
      } else {
        res.status(200).json({ success: true, message: `Successfully unsubscribed ${email}` });
      }
    } catch (err: any) {
      logger.error('Error handling unsubscribe:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 6. System Variable Registry & Providers Overview ────────────────────────

  public static async getVariables(req: Request, res: Response): Promise<void> {
    try {
      const variables = TemplateVariableRegistry.getAllDefinitions();
      res.status(200).json({ success: true, variables });
    } catch (err: any) {
      logger.error('Error retrieving variable definitions:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async getProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = ProviderRegistry.listAvailableProviders();
      res.status(200).json({ success: true, providers });
    } catch (err: any) {
      logger.error('Error listing providers:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
