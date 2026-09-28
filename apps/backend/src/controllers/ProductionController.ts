// apps/backend/src/controllers/ProductionController.ts
import { Request, Response, NextFunction } from 'express';
import { ProductionService } from '../services/ProductionService';

export class ProductionController {
  public static async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductionService.getProductionQueue();
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async advance(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = String(req.params.orderId);
      const { status } = req.body;
      const result = await ProductionService.advanceStatus(orderId, status);
      return res.status(200).json({
        message: 'Order production status updated',
        order: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default ProductionController;
