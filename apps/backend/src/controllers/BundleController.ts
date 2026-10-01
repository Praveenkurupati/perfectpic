// apps/backend/src/controllers/BundleController.ts
import { Request, Response, NextFunction } from 'express';
import { BundleService } from '../services/BundleService';

export class BundleController {
  /**
   * Public: List active bundle tiers for storefront and cart
   */
  public static async getActiveBundles(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await BundleService.getBundles(true);
      return res.status(200).json({ bundles: items, total: items.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: List all bundle tiers (active + inactive)
   */
  public static async getAllBundles(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await BundleService.getBundles(false);
      return res.status(200).json({ bundles: items, total: items.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single bundle tier by id/minQuantity
   */
  public static async getBundleById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const item = await BundleService.getBundleById(id);
      return res.status(200).json(item);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Create new bundle tier
   */
  public static async createBundle(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await BundleService.createBundle(req.body);
      return res.status(201).json({
        message: 'Bundle tier created successfully',
        bundle: created,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Update bundle tier
   */
  public static async updateBundle(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const updated = await BundleService.updateBundle(id, req.body);
      return res.status(200).json({
        message: 'Bundle tier updated successfully',
        bundle: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Delete bundle tier
   */
  public static async deleteBundle(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await BundleService.deleteBundle(id);
      return res.status(200).json({
        message: 'Bundle tier deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Reset to default bundle tiers (3 Books: ₹300, 6 Books: ₹1800, 12 Books: ₹4500)
   */
  public static async resetDefaults(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await BundleService.resetDefaults();
      return res.status(200).json({
        message: 'Bundle tiers reset to default values',
        bundles: items,
      });
    } catch (err) {
      next(err);
    }
  }
}
