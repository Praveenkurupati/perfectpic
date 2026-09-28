// apps/backend/src/controllers/AnalyticsController.ts
import { Request, Response } from 'express';
import { OrderRepository } from '../repositories/OrderRepository';
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
}

export default AnalyticsController;
