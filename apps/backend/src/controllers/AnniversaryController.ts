// apps/backend/src/controllers/AnniversaryController.ts
import { Request, Response } from 'express';
import { AnniversaryReminderService } from '../services/AnniversaryReminderService';
import { OrderRepository } from '../repositories/OrderRepository';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class AnniversaryController {
  /**
   * GET /api/v1/anniversary/upcoming
   * Retrieves all orders approaching their milestone anniversary
   */
  public static async getUpcoming(req: Request, res: Response): Promise<void> {
    try {
      const stage = req.query.stage ? (req.query.stage === 'all' ? 'all' : Number(req.query.stage)) : 'all';
      const search = req.query.search as string;
      const daysWindow = req.query.daysWindow ? Number(req.query.daysWindow) : 65;
      const limit = req.query.limit ? Number(req.query.limit) : 100;

      const candidates = await OrderRepository.findUpcomingAnniversaries({
        stage,
        search,
        daysWindow,
        limit,
      });

      res.status(200).json({
        success: true,
        count: candidates.length,
        candidates,
      });
    } catch (err: any) {
      logger.error('Error fetching upcoming anniversaries:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/v1/anniversary/metrics
   * Retrieves CRM milestone metrics: upcoming in 30d/60d, reminders sent, conversion rate, attributed revenue
   */
  public static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await AnniversaryReminderService.getMetrics();
      res.status(200).json({
        success: true,
        metrics,
      });
    } catch (err: any) {
      logger.error('Error fetching anniversary CRM metrics:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/v1/anniversary/trigger/:orderId
   * Manually trigger a personalized milestone reminder via WhatsApp and/or Email
   */
  public static async triggerReminder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = String(req.params.orderId);
      const { stage, channel, customPromo, customPhone, customEmail } = req.body;

      if (!orderId) {
        res.status(400).json({ success: false, error: 'Order ID is required' });
        return;
      }

      const result = await AnniversaryReminderService.sendAnniversaryReminder(orderId, {
        stage: stage ? Number(stage) : undefined,
        channel: channel || 'all',
        customPromo,
        customPhone,
        customEmail,
      });

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        result,
        message: result.success
          ? `Milestone reminder dispatched successfully for order ${result.orderNumber}`
          : `Failed to dispatch reminder: ${result.message || 'Unknown error'}`,
      });
    } catch (err: any) {
      logger.error('Error triggering milestone reminder:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/v1/anniversary/sweep
   * Manually trigger the daily milestone background sweep
   */
  public static async processSweep(req: Request, res: Response): Promise<void> {
    try {
      const summary = await AnniversaryReminderService.processScheduledAnniversaries();
      res.status(200).json({
        success: true,
        summary,
        message: `Milestone sweep complete: ${summary.successful} reminders dispatched across ${summary.processed} eligible orders.`,
      });
    } catch (err: any) {
      logger.error('Error executing milestone sweep:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/v1/anniversary/preview/:orderId
   * Preview generated WhatsApp and Email templates for a specific order and stage
   */
  public static async previewTemplates(req: Request, res: Response): Promise<void> {
    try {
      const orderId = String(req.params.orderId);
      const stage = req.query.stage ? Number(req.query.stage) : 2;
      const promoCode = (req.query.promoCode as string) || AnniversaryReminderService.PROMO_CODE;

      const order: any = await OrderRepository.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: `Order ${orderId} not found` });
        return;
      }

      const customerName = order.customerName || 'Collector';
      const orderTitle = order.title || order.productTitle || 'Archival Photobook';
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

      const occasion = AnniversaryReminderService.inferOccasion(orderTitle, order);
      const timing = AnniversaryReminderService.calculateMilestone(orderDate, order.occasion?.eventDate);

      const storefrontBase = env.FRONTEND_URL || 'http://localhost:3000';
      const reorderUrl = `${storefrontBase}/configure?template=first-anniversary&reorderFrom=${order.orderNumber || orderId}&occasion=${occasion.type}&promo=${promoCode}`;

      const whatsappText = AnniversaryReminderService.generateWhatsAppMessage({
        customerName,
        milestoneLabel: occasion.label,
        daysUntil: timing.daysUntil,
        stage,
        reorderUrl,
        promoCode,
      });

      const emailData = AnniversaryReminderService.generateEmailHtml({
        customerName,
        milestoneLabel: occasion.label,
        originalTitle: orderTitle,
        daysUntil: timing.daysUntil,
        stage,
        reorderUrl,
        promoCode,
        thumbnail: order.thumbnail || order.coverUrl,
      });

      res.status(200).json({
        success: true,
        preview: {
          customerName,
          orderTitle,
          occasion,
          timing,
          reorderUrl,
          promoCode,
          whatsapp: whatsappText,
          email: emailData,
        },
      });
    } catch (err: any) {
      logger.error('Error generating template preview:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default AnniversaryController;
