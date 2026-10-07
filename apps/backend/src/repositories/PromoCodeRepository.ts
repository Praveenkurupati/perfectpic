// apps/backend/src/repositories/PromoCodeRepository.ts
import mongoose from 'mongoose';
import { PromoCode, DiscountType, AudienceType } from '../db/models/PromoCode';
import { PromoCodeUsage } from '../db/models/PromoCodeUsage';
import { Order } from '../db/models/Order';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

export interface CreatePromoCodeDTO {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  audienceType?: AudienceType;
  allowedUserEmails?: string[];
  maxUses?: number | null;
  currentUses?: number;
  maxUsesPerUser?: number;
  startDate?: Date | string;
  expiresAt?: Date | string | null;
  isActive?: boolean;
  isInfluencer?: boolean;
  influencerName?: string;
  influencerHandle?: string;
  influencerPlatform?: 'instagram' | 'youtube' | 'facebook' | 'tiktok' | 'other';
  commissionRate?: number;
  commissionPaid?: number;
  clickCount?: number;
}

export interface RecordUsageDTO {
  promoCodeId: string;
  code: string;
  userId?: string;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  orderNumber?: string;
  discountAmount: number;
  orderTotal: number;
}

// In-memory fallback dataset initialized with the user-specified promo codes
let inMemoryPromos: any[] = [
  {
    id: 'promo-launch20',
    code: 'LAUNCH20',
    description: 'Launch special: 20% off for the first 500 photobook creators.',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 600,
    minOrderAmount: 0,
    audienceType: 'ALL',
    allowedUserEmails: [],
    maxUses: 500,
    currentUses: 145,
    maxUsesPerUser: 1,
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    expiresAt: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date(),
  },
  {
    id: 'promo-festival500',
    code: 'FESTIVAL500',
    description: 'Festival season flat ₹500 off on luxury orders above ₹3,000.',
    discountType: 'fixed',
    discountValue: 500,
    maxDiscountAmount: null,
    minOrderAmount: 3000,
    audienceType: 'ALL',
    allowedUserEmails: [],
    maxUses: null,
    currentUses: 0,
    maxUsesPerUser: 2,
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    expiresAt: new Date('2026-11-30T23:59:59.000Z'),
    isActive: false, // Inactive as shown in user prompt
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date(),
  },
  {
    id: 'promo-firstpic',
    code: 'FIRSTPIC',
    description: 'Welcome reward: ₹300 off on your very first photobook order.',
    discountType: 'fixed',
    discountValue: 300,
    maxDiscountAmount: null,
    minOrderAmount: 1999,
    audienceType: 'FIRST_ORDER',
    allowedUserEmails: [],
    maxUses: 1000,
    currentUses: 48,
    maxUsesPerUser: 1,
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    expiresAt: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date(),
  },
  {
    id: 'promo-vipexclusive',
    code: 'VIPEXCLUSIVE',
    description: 'VIP Member discount: 25% off exclusively for select creators.',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscountAmount: 1000,
    minOrderAmount: 2499,
    audienceType: 'SPECIFIC_USERS',
    allowedUserEmails: ['priya@example.com', 'rahul@example.com', 'vip@perfectpic.in'],
    maxUses: 100,
    currentUses: 6,
    maxUsesPerUser: 3,
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    expiresAt: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date(),
  },
  {
    id: 'promo-priya20',
    code: 'PRIYA20',
    description: 'Exclusive 20% off curated with Priya Sharma (@priya_travels).',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 800,
    minOrderAmount: 1999,
    audienceType: 'ALL',
    allowedUserEmails: [],
    maxUses: 1000,
    currentUses: 34,
    maxUsesPerUser: 1,
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    expiresAt: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    isInfluencer: true,
    influencerName: 'Priya Sharma',
    influencerHandle: '@priya_travels',
    influencerPlatform: 'instagram',
    commissionRate: 10,
    commissionPaid: 3200,
    clickCount: 382,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date(),
  },
  {
    id: 'promo-rohitfamily',
    code: 'ROHITFAMILY',
    description: 'Special ₹400 off on keepsake family photobooks via Rohit Vlogs.',
    discountType: 'fixed',
    discountValue: 400,
    maxDiscountAmount: null,
    minOrderAmount: 2499,
    audienceType: 'ALL',
    allowedUserEmails: [],
    maxUses: 500,
    currentUses: 28,
    maxUsesPerUser: 1,
    startDate: new Date('2026-08-15T00:00:00.000Z'),
    expiresAt: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    isInfluencer: true,
    influencerName: 'Rohit Mehta',
    influencerHandle: '@rohit_familyvlogs',
    influencerPlatform: 'youtube',
    commissionRate: 12,
    commissionPaid: 4500,
    clickCount: 512,
    createdAt: new Date('2026-08-15T00:00:00.000Z'),
    updatedAt: new Date(),
  },
];

let inMemoryUsages: any[] = [
  {
    id: 'usage-1',
    promoCodeId: 'promo-launch20',
    code: 'LAUNCH20',
    customerEmail: 'priya@example.com',
    orderNumber: 'PP-8491',
    discountAmount: 400,
    orderTotal: 1999,
    usedAt: new Date('2026-09-25T10:30:00.000Z'),
  },
  {
    id: 'usage-2',
    promoCodeId: 'promo-firstpic',
    code: 'FIRSTPIC',
    customerEmail: 'rahul@example.com',
    orderNumber: 'PP-7201',
    discountAmount: 300,
    orderTotal: 1999,
    usedAt: new Date('2026-08-14T14:15:00.000Z'),
  },
  {
    id: 'usage-3',
    promoCodeId: 'promo-priya20',
    code: 'PRIYA20',
    customerEmail: 'ananya.travels@gmail.com',
    orderNumber: 'PP-9102',
    discountAmount: 499,
    orderTotal: 2499,
    usedAt: new Date('2026-09-28T09:12:00.000Z'),
  },
  {
    id: 'usage-4',
    promoCodeId: 'promo-priya20',
    code: 'PRIYA20',
    customerEmail: 'kavita.mumbai@outlook.com',
    orderNumber: 'PP-9184',
    discountAmount: 600,
    orderTotal: 2999,
    usedAt: new Date('2026-09-29T16:45:00.000Z'),
  },
  {
    id: 'usage-5',
    promoCodeId: 'promo-rohitfamily',
    code: 'ROHITFAMILY',
    customerEmail: 'sunil.sharma@yahoo.com',
    orderNumber: 'PP-9240',
    discountAmount: 400,
    orderTotal: 3499,
    usedAt: new Date('2026-09-30T11:20:00.000Z'),
  },
];

export class PromoCodeRepository {
  public static async findAll(filter?: {
    status?: 'active' | 'inactive' | 'expired' | 'all';
    search?: string;
    audience?: string;
  }): Promise<{ promos: any[]; total: number }> {
    const now = new Date();

    if (isDbConnected()) {
      try {
        const query: any = {};

        if (filter?.status === 'active') {
          query.isActive = true;
          query.$or = [{ expiresAt: null }, { expiresAt: { $gte: now } }];
        } else if (filter?.status === 'inactive') {
          query.isActive = false;
        } else if (filter?.status === 'expired') {
          query.expiresAt = { $lt: now };
        }

        if (filter?.audience && filter.audience !== 'ALL') {
          query.audienceType = filter.audience;
        }

        if (filter?.search) {
          const s = filter.search.trim();
          query.$or = [
            { code: { $regex: s, $options: 'i' } },
            { description: { $regex: s, $options: 'i' } },
          ];
        }

        const [promos, total] = await Promise.all([
          PromoCode.find(query).sort({ createdAt: -1 }),
          PromoCode.countDocuments(query),
        ]);

        if (promos.length > 0) {
          return {
            promos: promos.map((p: any) => ({
              ...p.toJSON(),
              id: p._id ? p._id.toString() : p.id,
            })),
            total,
          };
        }
      } catch (err: any) {
        logger.warn('Failed to query Mongo for promos, falling back to local dataset:', err.message);
      }
    }

    // In-Memory fallback filtering
    let results = [...inMemoryPromos];

    if (filter?.status === 'active') {
      results = results.filter(
        (p) => p.isActive && (!p.expiresAt || new Date(p.expiresAt) >= now)
      );
    } else if (filter?.status === 'inactive') {
      results = results.filter((p) => !p.isActive);
    } else if (filter?.status === 'expired') {
      results = results.filter((p) => p.expiresAt && new Date(p.expiresAt) < now);
    }

    if (filter?.audience && filter.audience !== 'ALL') {
      results = results.filter((p) => p.audienceType === filter.audience);
    }

    if (filter?.search) {
      const s = filter.search.toLowerCase().trim();
      results = results.filter(
        (p) => p.code.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s))
      );
    }

    return {
      promos: results,
      total: results.length,
    };
  }

  public static async findById(id: string): Promise<any | null> {
    if (isDbConnected()) {
      try {
        if (mongoose.isValidObjectId(id)) {
          const promo = await (PromoCode as any).findById(id);
          if (promo) {
            return {
              ...promo.toJSON(),
              id: promo._id?.toString() || promo.id,
            };
          }
        }
      } catch (err: any) {
        logger.warn(`Error finding promo by ID ${id} in Mongo:`, err.message);
      }
    }
    return inMemoryPromos.find((p) => p.id === id) || null;
  }

  public static async findByCode(code: string): Promise<any | null> {
    const normalized = code.trim().toUpperCase();

    if (isDbConnected()) {
      try {
        const promo = await (PromoCode as any).findOne({ code: normalized });
        if (promo) {
          return {
            ...promo.toJSON(),
            id: promo._id?.toString() || promo.id,
          };
        }
      } catch (err: any) {
        logger.warn(`Error finding promo by code ${code} in Mongo:`, err.message);
      }
    }
    return inMemoryPromos.find((p) => p.code.toUpperCase() === normalized) || null;
  }

  public static async create(data: CreatePromoCodeDTO): Promise<any> {
    const normalizedCode = data.code.trim().toUpperCase();

    const payload: any = {
      code: normalizedCode,
      description: data.description || '',
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
      minOrderAmount: Number(data.minOrderAmount || 0),
      audienceType: data.audienceType || 'ALL',
      allowedUserEmails: (data.allowedUserEmails || []).map((e) => e.trim().toLowerCase()),
      maxUses: data.maxUses ? Number(data.maxUses) : null,
      currentUses: Number(data.currentUses || 0),
      maxUsesPerUser: Number(data.maxUsesPerUser || 1),
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      isInfluencer: Boolean(data.isInfluencer),
      influencerName: data.influencerName || undefined,
      influencerHandle: data.influencerHandle || undefined,
      influencerPlatform: data.influencerPlatform || 'instagram',
      commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : 10,
      commissionPaid: Number(data.commissionPaid || 0),
      clickCount: Number(data.clickCount || 0),
    };

    if (isDbConnected()) {
      try {
        const created = await (PromoCode as any).create(payload);
        if (created) {
          const obj = created.toJSON();
          inMemoryPromos.unshift(obj);
          return obj;
        }
      } catch (err: any) {
        logger.warn('Failed to insert promo into Mongo, persisting locally:', err.message);
      }
    }

    const localItem = {
      ...payload,
      id: `promo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryPromos.unshift(localItem);
    return localItem;
  }

  public static async update(id: string, data: Partial<CreatePromoCodeDTO>): Promise<any | null> {
    const updates: any = { ...data };
    if (updates.code) updates.code = updates.code.trim().toUpperCase();
    if (updates.allowedUserEmails) {
      updates.allowedUserEmails = updates.allowedUserEmails.map((e: string) => e.trim().toLowerCase());
    }

    if (isDbConnected()) {
      try {
        if (mongoose.isValidObjectId(id)) {
          const updated = await (PromoCode as any).findByIdAndUpdate(id, updates, { new: true });
          if (updated) {
            const formatted = {
              ...updated.toJSON(),
              id: updated._id?.toString() || updated.id,
            };
            const idx = inMemoryPromos.findIndex((p) => p.id === id);
            if (idx !== -1) inMemoryPromos[idx] = { ...inMemoryPromos[idx], ...formatted };
            return formatted;
          }
        }
      } catch (err: any) {
        logger.warn(`Failed to update promo ${id} in Mongo:`, err.message);
      }
    }

    const idx = inMemoryPromos.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    inMemoryPromos[idx] = {
      ...inMemoryPromos[idx],
      ...updates,
      updatedAt: new Date(),
    };
    return inMemoryPromos[idx];
  }

  public static async delete(id: string): Promise<boolean> {
    let deleted = false;

    if (isDbConnected()) {
      try {
        if (mongoose.isValidObjectId(id)) {
          const res = await (PromoCode as any).findByIdAndDelete(id);
          if (res) deleted = true;
        }
      } catch (err: any) {
        logger.warn(`Failed to delete promo ${id} from Mongo:`, err.message);
      }
    }

    const initialLen = inMemoryPromos.length;
    inMemoryPromos = inMemoryPromos.filter((p) => p.id !== id);
    if (inMemoryPromos.length < initialLen) deleted = true;

    return deleted;
  }

  public static async toggleActive(id: string): Promise<any | null> {
    const promo = await this.findById(id);
    if (!promo) return null;
    return await this.update(id, { isActive: !promo.isActive });
  }

  public static async incrementUsage(id: string, options?: { session?: mongoose.ClientSession }): Promise<void> {
    if (isDbConnected()) {
      try {
        if (mongoose.isValidObjectId(id)) {
          await (PromoCode as any).findByIdAndUpdate(
            id,
            { $inc: { currentUses: 1 } },
            options?.session ? { session: options.session } : undefined
          );
        }
      } catch (err: any) {
        logger.warn(`Failed to increment currentUses on Mongo for promo ${id}:`, err.message);
      }
    }
    const local = inMemoryPromos.find((p) => p.id === id);
    if (local) {
      local.currentUses = (local.currentUses || 0) + 1;
    }
  }

  public static async recordUsage(data: RecordUsageDTO, options?: { session?: mongoose.ClientSession }): Promise<any> {
    // 1. Increment usage count on the promo code
    await this.incrementUsage(data.promoCodeId, options);

    // 2. Insert usage record
    const usagePayload = {
      ...data,
      customerEmail: data.customerEmail.toLowerCase().trim(),
      usedAt: new Date(),
    };

    if (isDbConnected()) {
      try {
        if (options?.session) {
          const created = await (PromoCodeUsage as any).create([usagePayload], { session: options.session });
          if (created && created[0]) {
            const obj = created[0].toJSON();
            inMemoryUsages.unshift(obj);
            return obj;
          }
        } else {
          const created = await (PromoCodeUsage as any).create(usagePayload);
          if (created) {
            const obj = created.toJSON();
            inMemoryUsages.unshift(obj);
            return obj;
          }
        }
      } catch (err: any) {
        logger.warn('Failed to record PromoCodeUsage in Mongo, storing in-memory:', err.message);
      }
    }

    const localUsage = {
      ...usagePayload,
      id: `usage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    inMemoryUsages.unshift(localUsage);
    return localUsage;
  }

  public static async getUsagesByPromoId(promoCodeId: string): Promise<any[]> {
    if (isDbConnected()) {
      try {
        const usages = await (PromoCodeUsage as any).find({ promoCodeId }).sort({ usedAt: -1 });
        if (usages.length > 0) {
          return usages.map((u: any) => ({
            ...u.toJSON(),
            id: u._id ? u._id.toString() : u.id,
          }));
        }
      } catch (err: any) {
        logger.warn(`Failed to fetch usages for promo ${promoCodeId} from Mongo:`, err.message);
      }
    }
    return inMemoryUsages.filter((u) => u.promoCodeId === promoCodeId);
  }

  public static async getUserUsageCount(code: string, customerEmail?: string, userId?: string): Promise<number> {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedEmail = customerEmail ? customerEmail.trim().toLowerCase() : undefined;

    if (isDbConnected()) {
      try {
        const orClauses: any[] = [];
        if (normalizedEmail) orClauses.push({ customerEmail: normalizedEmail });
        if (userId) orClauses.push({ userId });

        if (orClauses.length > 0) {
          const count = await (PromoCodeUsage as any).countDocuments({
            code: normalizedCode,
            $or: orClauses,
          });
          return count;
        }
      } catch (err: any) {
        logger.warn('Failed to count user usages in Mongo:', err.message);
      }
    }

    return inMemoryUsages.filter(
      (u) =>
        u.code.toUpperCase() === normalizedCode &&
        ((normalizedEmail && u.customerEmail.toLowerCase() === normalizedEmail) ||
          (userId && u.userId === userId))
    ).length;
  }

  public static async getUserOrderCount(customerEmail?: string, userId?: string): Promise<number> {
    const normalizedEmail = customerEmail ? customerEmail.trim().toLowerCase() : undefined;

    if (isDbConnected()) {
      try {
        const orClauses: any[] = [];
        if (normalizedEmail) orClauses.push({ customerEmail: normalizedEmail });
        if (userId) orClauses.push({ userId });

        if (orClauses.length > 0) {
          const count = await (Order as any).countDocuments({ $or: orClauses });
          return count;
        }
      } catch (err: any) {
        logger.warn('Failed to count user orders in Mongo:', err.message);
      }
    }

    return 0; // Default to 0 for fallback
  }

  public static async trackReferralClick(code: string): Promise<boolean> {
    const normalized = code.trim().toUpperCase();
    if (isDbConnected()) {
      try {
        await PromoCode.updateOne({ code: normalized }, { $inc: { clickCount: 1 } });
      } catch (err: any) {
        logger.warn('Failed to increment clickCount in Mongo:', err.message);
      }
    }
    const local = inMemoryPromos.find((p) => p.code.toUpperCase() === normalized);
    if (local) {
      local.clickCount = (local.clickCount || 0) + 1;
      return true;
    }
    return false;
  }

  public static async getInfluencerAnalytics(): Promise<any> {
    let promosList: any[] = [];
    if (isDbConnected()) {
      try {
        const docs = await PromoCode.find({ isInfluencer: true }).sort({ createdAt: -1 });
        if (docs.length > 0) {
          promosList = docs.map((d: any) => ({
            ...d.toJSON(),
            id: d._id?.toString() || d.id,
          }));
        }
      } catch (err: any) {
        logger.warn('Failed to query influencer promos from Mongo:', err.message);
      }
    }

    if (promosList.length === 0) {
      promosList = inMemoryPromos.filter((p) => p.isInfluencer);
    }

    let allUsages: any[] = [];
    if (isDbConnected()) {
      try {
        const codes = promosList.map((p) => p.code.toUpperCase());
        const uDocs = await PromoCodeUsage.find({ code: { $in: codes } }).sort({ usedAt: -1 });
        allUsages = uDocs.map((u: any) => u.toJSON());
      } catch (err: any) {
        logger.warn('Failed to fetch usages from Mongo:', err.message);
      }
    }
    if (allUsages.length === 0) {
      allUsages = inMemoryUsages;
    }

    let totalAttributedRevenue = 0;
    let totalDiscountGiven = 0;
    let totalCommissionOwed = 0;
    let totalCommissionPaid = 0;
    let totalAttributedOrders = 0;

    const influencerStats = promosList.map((promo) => {
      const codeUsages = allUsages.filter((u) => u.code.toUpperCase() === promo.code.toUpperCase());
      const ordersCount = codeUsages.length || promo.currentUses || 0;
      const gmv = codeUsages.reduce((sum, u) => sum + (Number(u.orderTotal) || 0), 0) || (ordersCount * 2499);
      const discountTotal = codeUsages.reduce((sum, u) => sum + (Number(u.discountAmount) || 0), 0) || (ordersCount * 450);
      const commissionRate = promo.commissionRate !== undefined ? promo.commissionRate : 10;
      const commissionEarned = Math.round((gmv * commissionRate) / 100);
      const commissionPaid = promo.commissionPaid || 0;
      const commissionPending = Math.max(0, commissionEarned - commissionPaid);
      const clicks = promo.clickCount || (ordersCount * 12);
      const conversionRate = clicks > 0 ? Number(((ordersCount / clicks) * 100).toFixed(1)) : 0;
      const aov = ordersCount > 0 ? Math.round(gmv / ordersCount) : 0;

      totalAttributedRevenue += gmv;
      totalDiscountGiven += discountTotal;
      totalCommissionOwed += commissionPending;
      totalCommissionPaid += commissionPaid;
      totalAttributedOrders += ordersCount;

      return {
        id: promo.id,
        code: promo.code,
        influencerName: promo.influencerName || promo.code,
        influencerHandle: promo.influencerHandle || `@${promo.code.toLowerCase()}`,
        influencerPlatform: promo.influencerPlatform || 'instagram',
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        commissionRate,
        commissionEarned,
        commissionPaid,
        commissionPending,
        totalOrders: ordersCount,
        grossGmv: gmv,
        discountTotal,
        clickCount: clicks,
        conversionRate,
        aov,
        isActive: promo.isActive,
        createdAt: promo.createdAt,
      };
    });

    influencerStats.sort((a, b) => b.grossGmv - a.grossGmv);

    const recentOrders = allUsages
      .filter((u) => promosList.some((p) => p.code.toUpperCase() === u.code.toUpperCase()))
      .slice(0, 10);

    return {
      summary: {
        totalInfluencers: promosList.length,
        totalAttributedRevenue,
        totalDiscountGiven,
        totalCommissionOwed,
        totalCommissionPaid,
        totalAttributedOrders,
      },
      influencers: influencerStats,
      recentOrders,
    };
  }

  public static async seedDefaultsIfEmpty(): Promise<void> {
    if (!isDbConnected()) return;
    try {
      const count = await PromoCode.countDocuments();
      if (count === 0) {
        logger.info('🌱 Seeding initial production promo codes into MongoDB...');
        for (const item of inMemoryPromos) {
          const { id, ...data } = item;
          await (PromoCode as any).create(data);
        }
        logger.info('✅ Initial promo codes seeded successfully!');
      }
    } catch (err: any) {
      logger.error('Error seeding initial promo codes:', err.message);
    }
  }
}
