// apps/backend/src/controllers/AnalyticsController.ts
import { Request, Response } from 'express';
import { OrderRepository } from '../repositories/OrderRepository';
import { AnalyticsRepository, BehaviourFilters } from '../repositories/AnalyticsRepository';
import { MetaCapiService } from '../services/MetaCapiService';
import { ApiResponse } from '../utils/apiResponse';
import { OperationsService } from '../services/OperationsService';
import { SlaService } from '../services/SlaService';

export class AnalyticsController {
  public static async getDashboardStats(req: Request, res: Response) {
    const data = await OrderRepository.getDashboardStats();
    return ApiResponse.success(res, data, 'Analytics data retrieved successfully');
  }

  public static async getRevenueData(req: Request, res: Response) {
    const data = await OrderRepository.getDashboardStats();
    return ApiResponse.success(res, data.revenueData, 'Revenue trend retrieved successfully');
  }

  /**
   * Command Center Master Business Intelligence (Health, Realtime, Alerts, SLA, Financials)
   * GET /api/v1/analytics/command-center
   */
  public static async getCommandCenterStats(req: Request, res: Response) {
    try {
      // 1. Fetch dashboard aggregated metrics and lean orders concurrently in parallel
      const [dashboard, ordersRes] = await Promise.all([
        OrderRepository.getDashboardStats(),
        OrderRepository.findAll({ limit: 100 }),
      ]);
      const orders: any[] = ordersRes?.orders || [];

      // 2. Compute in-memory operational metrics reusing preloaded lean data
      const sla = SlaService.calculateOverview(orders);
      const realtime = await OperationsService.getRealtimeStatus(orders);
      const health = OperationsService.calculateBusinessHealth(sla, realtime);
      const alerts = await OperationsService.getAttentionItems(orders);
      const financials = await OperationsService.getFinancials(dashboard);
      const dailySummary = await OperationsService.getDailySummary({
        realtime,
        financials,
        orders,
        slaMetrics: sla,
      });

      const data = {
        ...dashboard,
        health,
        realtime,
        alerts,
        sla,
        financials,
        dailySummary,
      };

      return ApiResponse.success(res, data, 'Command Center business data retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to retrieve command center data', 500, 'COMMAND_CENTER_ERROR');
    }
  }

  /**
   * SLA & Operations Intelligence
   * GET /api/v1/analytics/sla
   */
  public static async getSlaMetrics(req: Request, res: Response) {
    try {
      const ordersRes = await OrderRepository.findAll({ limit: 200 });
      const orders: any[] = ordersRes?.orders || [];
      const sla = SlaService.calculateOverview(orders);
      return ApiResponse.success(res, sla, 'SLA operational metrics retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to calculate SLA metrics', 500, 'SLA_ERROR');
    }
  }

  /**
   * Attention Required Center Alerts
   * GET /api/v1/analytics/alerts
   */
  public static async getAlerts(req: Request, res: Response) {
    try {
      const alerts = await OperationsService.getAttentionItems();
      return ApiResponse.success(res, { alerts, total: alerts.length }, 'Attention alerts retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to retrieve alerts', 500, 'ALERTS_ERROR');
    }
  }

  /**
   * Financial Decomposition & Unit Economics
   * GET /api/v1/analytics/financials
   */
  public static async getFinancials(req: Request, res: Response) {
    try {
      const financials = await OperationsService.getFinancials();
      return ApiResponse.success(res, financials, 'Financial decomposition and unit economics retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to retrieve financials', 500, 'FINANCIALS_ERROR');
    }
  }

  /**
   * 9-Step Photobook Funnel & Drop-off Analytics
   * GET /api/v1/analytics/funnel
   */
  public static async getFunnelAnalytics(req: Request, res: Response) {
    try {
      const funnel = OperationsService.getFunnelAnalytics();
      return ApiResponse.success(res, funnel, 'Photobook conversion funnel analytics retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to retrieve funnel analytics', 500, 'FUNNEL_ERROR');
    }
  }

  /**
   * Daily Business Summary
   * GET /api/v1/analytics/daily-summary
   */
  public static async getDailySummary(req: Request, res: Response) {
    try {
      const summary = await OperationsService.getDailySummary();
      return ApiResponse.success(res, summary, 'Daily business summary retrieved');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to retrieve daily summary', 500, 'SUMMARY_ERROR');
    }
  }

  /**
   * Ingest client-side telemetry events (single or batch)
   * POST /api/v1/analytics/events
   */
  public static async ingestEvents(req: Request, res: Response) {
    try {
      let payload = req.body;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          // ignore
        }
      }
      const rawEvents = Array.isArray(payload?.events) 
        ? payload.events 
        : Array.isArray(payload) 
          ? payload 
          : payload ? [payload] : [];

      const count = await AnalyticsRepository.recordEvents(rawEvents);
      return ApiResponse.success(res, { ingested: count }, 'Events ingested successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to ingest events', 400, 'INGESTION_ERROR');
    }
  }

  /**
   * Retrieve rich user behaviour analytics with guest vs member breakdown
   * GET /api/v1/analytics/behaviour
   */
  public static async getBehaviourAnalytics(req: Request, res: Response) {
    try {
      const filters: BehaviourFilters = {
        userType: req.query.userType as any,
        timeRange: req.query.timeRange as any,
        device: req.query.device as any,
        source: req.query.source as any,
      };

      const data = await AnalyticsRepository.getBehaviourAnalytics(filters);
      return ApiResponse.success(res, data, 'User behaviour analytics retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to retrieve behaviour analytics', 500, 'ANALYTICS_ERROR');
    }
  }

  /**
   * Real-time live user journeys
   * GET /api/v1/analytics/live-feed
   */
  public static async getLiveJourneys(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const data = AnalyticsRepository.getRecentJourneys(limit);
      return ApiResponse.success(res, data, 'Live user journeys retrieved successfully');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to retrieve live journeys', 500, 'FEED_ERROR');
    }
  }

  /**
   * Relay client-side event to Meta Conversions API (CAPI) with server-side enrichment
   * POST /api/v1/analytics/meta-capi
   */
  public static async relayMetaCapi(req: Request, res: Response) {
    try {
      const { eventName, eventId, eventSourceUrl, userData = {}, customData = {} } = req.body;
      if (!eventName) {
        return ApiResponse.error(res, 'eventName is required', 400, 'VALIDATION_ERROR');
      }

      // Enrich with server headers
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
      const clientUserAgent = req.headers['user-agent'] as string;

      const result = await MetaCapiService.sendEvent({
        eventName,
        eventId,
        eventSourceUrl: eventSourceUrl || (req.headers.referer as string) || 'https://perfectpic.in',
        actionSource: 'website',
        userData: {
          ...userData,
          clientIp: userData.clientIp || clientIp,
          clientUserAgent: userData.clientUserAgent || clientUserAgent,
        },
        customData,
      });

      return ApiResponse.success(res, result, 'Meta CAPI event processed');
    } catch (err: any) {
      return ApiResponse.error(res, err.message || 'Failed to dispatch Meta CAPI event', 500, 'CAPI_ERROR');
    }
  }
}

export default AnalyticsController;
