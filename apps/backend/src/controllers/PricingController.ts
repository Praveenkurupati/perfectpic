// apps/backend/src/controllers/PricingController.ts
import { Request, Response, NextFunction } from 'express';
import { PricingService } from '../services/PricingService';

export class PricingController {
  public static async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await PricingService.calculateOrderPrice({
        ...req.body,
        userId: user?.id || user?._id || req.body.userId,
        customerEmail: user?.email || req.body.customerEmail,
        customerPhone: user?.phone || req.body.customerPhone,
      });

      return res.status(200).json({
        success: true,
        pricing: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await PricingService.calculateOrderPrice({
        ...req.body,
        userId: user?.id || user?._id || req.body.userId,
        customerEmail: user?.email || req.body.customerEmail,
        customerPhone: user?.phone || req.body.customerPhone,
        claimedTotal: Number(req.body.claimedTotal ?? req.body.total ?? req.body.amount),
      });

      return res.status(200).json({
        valid: true,
        pricing: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default PricingController;
