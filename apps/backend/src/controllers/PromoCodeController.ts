// apps/backend/src/controllers/PromoCodeController.ts
import { Request, Response, NextFunction } from 'express';
import { PromoCodeService } from '../services/PromoCodeService';

export class PromoCodeController {
  // Public validation endpoint for Storefront / Cart / Checkout
  public static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, subtotal, customerEmail, customerPhone, userId } = req.body;
      const result = await PromoCodeService.validatePromo({
        code,
        subtotal: Number(subtotal || 0),
        customerEmail: customerEmail || (req.user as any)?.email,
        customerPhone,
        userId: userId || (req.user as any)?.id,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Public available offers list for Cart / Checkout banner
  public static async getActiveOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const offers = await PromoCodeService.getActivePublicPromos();
      return res.status(200).json({ offers });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Get all promo codes with filters
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, audience } = req.query;
      const result = await PromoCodeService.getAllPromos({
        status: status as any,
        search: search as string,
        audience: audience as string,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Admin: Get single promo code
  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const promo = await PromoCodeService.getPromoById(id);
      return res.status(200).json(promo);
    } catch (err) {
      next(err);
    }
  }

  // Admin: Create new promo code
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const promo = await PromoCodeService.createPromo(req.body);
      return res.status(201).json({
        message: 'Promo code created successfully',
        promo,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Update promo code
  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const updated = await PromoCodeService.updatePromo(id, req.body);
      return res.status(200).json({
        message: 'Promo code updated successfully',
        promo: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: Delete promo code
  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await PromoCodeService.deletePromo(id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Admin: Toggle active status
  public static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const promo = await PromoCodeService.toggleStatus(id);
      return res.status(200).json({
        message: `Promo code ${promo.isActive ? 'activated' : 'deactivated'} successfully`,
        promo,
      });
    } catch (err) {
      next(err);
    }
  }

  // Admin: View usage history
  public static async getUsages(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await PromoCodeService.getUsages(id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Admin: View comprehensive influencer/creator analytics
  public static async getInfluencerAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PromoCodeService.getInfluencerAnalytics();
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Public: Log creator referral click from /ref/:code
  public static async trackReferralClick(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const success = await PromoCodeService.trackReferralClick(code);
      return res.status(200).json({ success, code });
    } catch (err) {
      next(err);
    }
  }
}
