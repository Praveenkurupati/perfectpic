// apps/backend/src/services/PromoCodeService.ts
import { PromoCodeRepository, CreatePromoCodeDTO } from '../repositories/PromoCodeRepository';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export interface ValidatePromoInput {
  code: string;
  subtotal: number;
  customerEmail?: string;
  customerPhone?: string;
  userId?: string;
}

export interface ValidatePromoResult {
  valid: boolean;
  code: string;
  promoId: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount: number | null;
  discountAmount: number;
  minOrderAmount: number;
  description: string;
  message: string;
}

export class PromoCodeService {
  public static async validatePromo(input: ValidatePromoInput): Promise<ValidatePromoResult> {
    const rawCode = (input.code || '').trim().toUpperCase();
    if (!rawCode) {
      throw ApiError.badRequest('Promo code is required.');
    }

    const promo = await PromoCodeRepository.findByCode(rawCode);
    if (!promo) {
      throw ApiError.badRequest(`Invalid coupon code '${rawCode}'.`);
    }

    const now = new Date();

    // 1. Active status check
    if (!promo.isActive) {
      throw ApiError.badRequest(`Coupon code '${promo.code}' is currently inactive.`);
    }

    // 2. Start date check
    if (promo.startDate && new Date(promo.startDate) > now) {
      throw ApiError.badRequest(`Coupon code '${promo.code}' is not active yet.`);
    }

    // 3. Expiry check
    if (promo.expiresAt && new Date(promo.expiresAt) < now) {
      const expDate = new Date(promo.expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      throw ApiError.badRequest(`Coupon code '${promo.code}' expired on ${expDate}.`);
    }

    // 4. Global usage limit check
    if (promo.maxUses !== null && promo.maxUses !== undefined && promo.currentUses >= promo.maxUses) {
      throw ApiError.badRequest(`Coupon code '${promo.code}' has reached its maximum total usage limit.`);
    }

    // 5. Minimum cart subtotal check
    const subtotal = Number(input.subtotal || 0);
    if (promo.minOrderAmount > 0 && subtotal < promo.minOrderAmount) {
      throw ApiError.badRequest(
        `Minimum order value of ₹${promo.minOrderAmount.toLocaleString('en-IN')} required for coupon '${promo.code}'. Current cart subtotal: ₹${subtotal.toLocaleString('en-IN')}.`
      );
    }

    // 6. Audience check
    if (promo.audienceType === 'FIRST_ORDER') {
      if (input.customerEmail || input.userId) {
        const orderCount = await PromoCodeRepository.getUserOrderCount(input.customerEmail, input.userId);
        if (orderCount > 0) {
          throw ApiError.badRequest(`Coupon '${promo.code}' is valid only for first-time customers.`);
        }
      }
    } else if (promo.audienceType === 'SPECIFIC_USERS') {
      const allowed = (promo.allowedUserEmails || []).map((e: string) => e.toLowerCase().trim());
      const email = (input.customerEmail || '').toLowerCase().trim();
      if (!email || !allowed.includes(email)) {
        throw ApiError.badRequest(
          `Coupon '${promo.code}' is restricted and not applicable to this account.`
        );
      }
    }

    // 7. Per-user redemption limit check
    if (input.customerEmail || input.userId) {
      const userRedemptions = await PromoCodeRepository.getUserUsageCount(
        promo.code,
        input.customerEmail,
        input.userId
      );
      const limit = promo.maxUsesPerUser || 1;
      if (userRedemptions >= limit) {
        throw ApiError.badRequest(
          `You have already redeemed coupon '${promo.code}' the maximum allowed number of times (${limit}).`
        );
      }
    }

    // 8. Calculate precise discount
    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      const rawDiscount = Math.round((subtotal * promo.discountValue) / 100);
      if (promo.maxDiscountAmount && promo.maxDiscountAmount > 0) {
        discountAmount = Math.min(rawDiscount, promo.maxDiscountAmount);
      } else {
        discountAmount = rawDiscount;
      }
    } else {
      // Fixed / Flat discount
      discountAmount = Math.min(promo.discountValue, subtotal);
    }

    const discountSummary =
      promo.discountType === 'percentage'
        ? `${promo.discountValue}% OFF${promo.maxDiscountAmount ? ` (up to ₹${promo.maxDiscountAmount})` : ''}`
        : `₹${promo.discountValue} OFF`;

    return {
      valid: true,
      code: promo.code,
      promoId: promo.id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscountAmount: promo.maxDiscountAmount || null,
      discountAmount,
      minOrderAmount: promo.minOrderAmount,
      description: promo.description || '',
      message: `Coupon '${promo.code}' applied! You saved ₹${discountAmount.toLocaleString('en-IN')} (${discountSummary}).`,
    };
  }

  public static async getAllPromos(filter?: {
    status?: 'active' | 'inactive' | 'expired' | 'all';
    search?: string;
    audience?: string;
  }) {
    return await PromoCodeRepository.findAll(filter);
  }

  public static async getActivePublicPromos() {
    const { promos } = await PromoCodeRepository.findAll({ status: 'active' });
    // Filter down to general public or first-order coupons (hide private VIP emails)
    return promos
      .filter((p) => p.audienceType === 'ALL' || p.audienceType === 'FIRST_ORDER')
      .map((p) => ({
        code: p.code,
        description: p.description,
        discountType: p.discountType,
        discountValue: p.discountValue,
        maxDiscountAmount: p.maxDiscountAmount,
        minOrderAmount: p.minOrderAmount,
        audienceType: p.audienceType,
        expiresAt: p.expiresAt,
      }));
  }

  public static async getPromoById(id: string) {
    const promo = await PromoCodeRepository.findById(id);
    if (!promo) {
      throw ApiError.notFound(`Promo code with ID '${id}' not found.`);
    }
    return promo;
  }

  public static async createPromo(data: CreatePromoCodeDTO) {
    if (!data.code || !data.code.trim()) {
      throw ApiError.badRequest('Promo code is required.');
    }
    if (!data.discountValue || data.discountValue <= 0) {
      throw ApiError.badRequest('Discount value must be greater than zero.');
    }
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      throw ApiError.badRequest('Percentage discount cannot exceed 100%.');
    }

    const existing = await PromoCodeRepository.findByCode(data.code);
    if (existing) {
      throw ApiError.conflict(`A promo code with the name '${data.code.toUpperCase()}' already exists.`);
    }

    return await PromoCodeRepository.create(data);
  }

  public static async updatePromo(id: string, data: Partial<CreatePromoCodeDTO>) {
    const promo = await PromoCodeRepository.findById(id);
    if (!promo) {
      throw ApiError.notFound(`Promo code with ID '${id}' not found.`);
    }

    if (data.code && data.code.trim().toUpperCase() !== promo.code.toUpperCase()) {
      const existing = await PromoCodeRepository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw ApiError.conflict(`A promo code with name '${data.code.toUpperCase()}' already exists.`);
      }
    }

    return await PromoCodeRepository.update(id, data);
  }

  public static async deletePromo(id: string) {
    const deleted = await PromoCodeRepository.delete(id);
    if (!deleted) {
      throw ApiError.notFound(`Promo code with ID '${id}' not found.`);
    }
    return { success: true, message: 'Promo code deleted successfully.' };
  }

  public static async toggleStatus(id: string) {
    const updated = await PromoCodeRepository.toggleActive(id);
    if (!updated) {
      throw ApiError.notFound(`Promo code with ID '${id}' not found.`);
    }
    return updated;
  }

  public static async getUsages(id: string) {
    const promo = await PromoCodeRepository.findById(id);
    if (!promo) {
      throw ApiError.notFound(`Promo code with ID '${id}' not found.`);
    }
    const usages = await PromoCodeRepository.getUsagesByPromoId(id);
    return {
      promo,
      usages,
      totalUsages: usages.length,
    };
  }

  public static async recordOrderPromoUsage(params: {
    code: string;
    orderId: string;
    orderNumber: string;
    customerEmail: string;
    customerPhone?: string;
    userId?: string;
    discountAmount: number;
    orderTotal: number;
  }) {
    if (!params.code) return null;
    const promo = await PromoCodeRepository.findByCode(params.code);
    if (!promo) return null;

    return await PromoCodeRepository.recordUsage({
      promoCodeId: promo.id,
      code: promo.code,
      userId: params.userId,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      discountAmount: params.discountAmount,
      orderTotal: params.orderTotal,
    });
  }
}
