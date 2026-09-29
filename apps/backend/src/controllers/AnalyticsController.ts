// apps/backend/src/controllers/AnalyticsController.ts
import { Request, Response } from 'express';
import { OrderRepository } from '../repositories/OrderRepository';
import { AnalyticsRepository, BehaviourFilters } from '../repositories/AnalyticsRepository';
import { ApiResponse } from '../utils/apiResponse';

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
}

export default AnalyticsController;
