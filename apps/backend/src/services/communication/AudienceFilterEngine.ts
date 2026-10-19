// apps/backend/src/services/communication/AudienceFilterEngine.ts
import mongoose from 'mongoose';
import { User } from '../../db/models/User';
import { Order } from '../../db/models/Order';
import { Project } from '../../db/models/Project';
import { SuppressionService } from './SuppressionService';
import { TemplateVariableRegistry } from './TemplateVariableRegistry';

export interface IAudienceFilter {
  // Customer identity
  customerIds?: string[];
  role?: 'user' | 'admin' | 'all';
  registeredAfter?: string | Date;
  registeredBefore?: string | Date;
  registeredWithinDays?: number;
  emailDomain?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
  storeCreditMin?: number;

  // Order & Purchase
  hasOrdered?: boolean;
  orderCountMin?: number;
  orderCountMax?: number;
  totalSpentMin?: number;
  totalSpentMax?: number;
  lastOrderWithinDays?: number;
  lastOrderBeforeDays?: number;
  orderStatuses?: string[];
  purchasedProductSlug?: string;

  // Photobook Project Behavior
  hasDraftProject?: boolean;
  hasAbandonedProject?: boolean;
  projectCountMin?: number;

  // Lifecycle Segment
  customerSegment?: 'all' | 'new' | 'active' | 'vip' | 'at_risk' | 'churned';

  // Enforcement
  respectSuppression?: boolean;
  respectNotificationPreferences?: boolean;
}

export interface IAudienceCountResult {
  totalMatched: number;
  eligible: number;
  suppressed: number;
  missingContact: number;
  optedOut: number;
  exclusionBreakdown: {
    missingContact: number;
    suppressed: number;
    notificationPreferenceOptOut: number;
  };
}

export interface IAudiencePreviewRecipient {
  userId: string;
  name: string;
  email: string;
  phone: string;
  isEligible: boolean;
  ineligibilityReason?: string;
  sampleVariables: Record<string, string>;
}

export class AudienceFilterEngine {
  /**
   * Compiles high-level filter criteria into a MongoDB query for the `User` collection
   */
  public static async buildMongoQuery(filter: IAudienceFilter = {}): Promise<Record<string, any>> {
    const query: Record<string, any> = {};

    // 1. Role filter (default only regular users, exclude staff admins)
    if (filter.role && filter.role !== 'all') {
      query.role = filter.role;
    } else if (!filter.role) {
      query.role = 'user';
    }

    // 2. Explicit Customer IDs
    if (filter.customerIds && filter.customerIds.length > 0) {
      const validIds = filter.customerIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      if (validIds.length > 0) {
        query._id = { $in: validIds };
      }
    }

    // 3. Registration date bounds
    const now = new Date();
    if (filter.registeredWithinDays) {
      const pastDate = new Date(now.getTime() - filter.registeredWithinDays * 24 * 60 * 60 * 1000);
      query.createdAt = { ...(query.createdAt || {}), $gte: pastDate };
    }
    if (filter.registeredAfter) {
      query.createdAt = { ...(query.createdAt || {}), $gte: new Date(filter.registeredAfter) };
    }
    if (filter.registeredBefore) {
      query.createdAt = { ...(query.createdAt || {}), $lte: new Date(filter.registeredBefore) };
    }

    // 4. Email domain filter
    if (filter.emailDomain && filter.emailDomain.trim()) {
      const domain = filter.emailDomain.trim().replace(/^@/, '');
      query.email = { $regex: `@${domain}$`, $options: 'i' };
    }

    // 5. Contact availability
    if (filter.hasPhone === true) {
      query.phone = { $exists: true, $ne: '', $regex: /\d{8,}/ };
    }
    if (filter.hasEmail === true) {
      query.email = { $exists: true, $ne: '', $regex: /@/ };
    }

    // 6. Store credit
    if (filter.storeCreditMin !== undefined && filter.storeCreditMin > 0) {
      query.storeCredit = { $gte: filter.storeCreditMin };
    }

    // 7. Order-based filters
    const orderUserIdFilter = await this.resolveOrderUserIds(filter);
    if (orderUserIdFilter !== null) {
      if (query._id) {
        // Intersect existing _id filter
        query._id = { $all: [query._id, orderUserIdFilter] };
      } else {
        query._id = orderUserIdFilter;
      }
    }

    // 8. Project-based filters
    const projectUserIdFilter = await this.resolveProjectUserIds(filter);
    if (projectUserIdFilter !== null) {
      if (query._id) {
        query._id = { ...query._id, ...projectUserIdFilter };
      } else {
        query._id = projectUserIdFilter;
      }
    }

    // 9. Lifecycle Customer Segment presets
    if (filter.customerSegment && filter.customerSegment !== 'all') {
      const segmentUserIds = await this.resolveSegmentUserIds(filter.customerSegment);
      if (segmentUserIds !== null) {
        if (query._id) {
          query._id = { ...query._id, ...segmentUserIds };
        } else {
          query._id = segmentUserIds;
        }
      }
    }

    return query;
  }

  /**
   * Resolves User IDs matching order criteria
   */
  private static async resolveOrderUserIds(filter: IAudienceFilter): Promise<Record<string, any> | null> {
    const hasOrderFilters =
      filter.hasOrdered !== undefined ||
      filter.orderCountMin !== undefined ||
      filter.orderCountMax !== undefined ||
      filter.totalSpentMin !== undefined ||
      filter.totalSpentMax !== undefined ||
      filter.lastOrderWithinDays !== undefined ||
      filter.lastOrderBeforeDays !== undefined ||
      (filter.orderStatuses && filter.orderStatuses.length > 0) ||
      Boolean(filter.purchasedProductSlug);

    if (!hasOrderFilters) return null;

    if (filter.hasOrdered === false) {
      // Find all users who HAVE ordered, then use $nin
      const distinctUsers = await Order.distinct('userId', { userId: { $exists: true, $ne: null } });
      return { $nin: distinctUsers };
    }

    const matchStage: any = { userId: { $exists: true, $ne: null } };
    const now = new Date();

    if (filter.orderStatuses && filter.orderStatuses.length > 0) {
      matchStage.status = { $in: filter.orderStatuses };
    }
    if (filter.lastOrderWithinDays) {
      const cutoff = new Date(now.getTime() - filter.lastOrderWithinDays * 24 * 60 * 60 * 1000);
      matchStage.createdAt = { ...(matchStage.createdAt || {}), $gte: cutoff };
    }
    if (filter.lastOrderBeforeDays) {
      const cutoff = new Date(now.getTime() - filter.lastOrderBeforeDays * 24 * 60 * 60 * 1000);
      matchStage.createdAt = { ...(matchStage.createdAt || {}), $lte: cutoff };
    }
    if (filter.purchasedProductSlug) {
      matchStage['items.productSlug'] = filter.purchasedProductSlug;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalAmount', '$pricing.total', 0] } },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ];

    const havingMatch: any = {};
    if (filter.orderCountMin !== undefined) havingMatch.orderCount = { ...(havingMatch.orderCount || {}), $gte: filter.orderCountMin };
    if (filter.orderCountMax !== undefined) havingMatch.orderCount = { ...(havingMatch.orderCount || {}), $lte: filter.orderCountMax };
    if (filter.totalSpentMin !== undefined) havingMatch.totalSpent = { ...(havingMatch.totalSpent || {}), $gte: filter.totalSpentMin };
    if (filter.totalSpentMax !== undefined) havingMatch.totalSpent = { ...(havingMatch.totalSpent || {}), $lte: filter.totalSpentMax };

    if (Object.keys(havingMatch).length > 0) {
      pipeline.push({ $match: havingMatch });
    }

    const aggResults = await Order.aggregate(pipeline);
    const userIds = aggResults.map(r => r._id).filter(id => mongoose.Types.ObjectId.isValid(id));

    return { $in: userIds };
  }

  /**
   * Resolves User IDs matching project behavior criteria
   */
  private static async resolveProjectUserIds(filter: IAudienceFilter): Promise<Record<string, any> | null> {
    const hasProjectFilters =
      filter.hasDraftProject !== undefined ||
      filter.hasAbandonedProject !== undefined ||
      filter.projectCountMin !== undefined;

    if (!hasProjectFilters) return null;

    const matchStage: any = { userId: { $exists: true, $ne: null } };
    const now = new Date();

    if (filter.hasDraftProject === true) {
      matchStage.status = 'Draft';
    }
    if (filter.hasAbandonedProject === true) {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      matchStage.status = 'Draft';
      matchStage.progressPercentage = { $gt: 0 };
      matchStage.updatedAt = { $lte: cutoff };
    }

    if (filter.projectCountMin !== undefined && filter.projectCountMin > 1) {
      const agg = await Project.aggregate([
        { $match: matchStage },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $match: { count: { $gte: filter.projectCountMin } } },
      ]);
      return { $in: agg.map(a => a._id).filter(id => mongoose.Types.ObjectId.isValid(id)) };
    }

    const distinctUsers = await Project.distinct('userId', matchStage);
    const validIds = distinctUsers.filter(id => mongoose.Types.ObjectId.isValid(id));
    return { $in: validIds };
  }

  /**
   * Resolves User IDs for predefined marketing lifecycle segments
   */
  private static async resolveSegmentUserIds(segment: string): Promise<Record<string, any> | null> {
    const now = new Date();
    switch (segment) {
      case 'vip': {
        // VIP: Total spent >= ₹10,000 or orderCount >= 3
        const vipAgg = await Order.aggregate([
          { $match: { userId: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: '$userId',
              totalSpent: { $sum: { $ifNull: ['$totalAmount', '$pricing.total', 0] } },
              orderCount: { $sum: 1 },
            },
          },
          { $match: { $or: [{ totalSpent: { $gte: 10000 } }, { orderCount: { $gte: 3 } }] } },
        ]);
        return { $in: vipAgg.map(v => v._id).filter(id => mongoose.Types.ObjectId.isValid(id)) };
      }
      case 'new': {
        // New: Registered in last 14 days and 0 orders
        const recentDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const orderedUsers = await Order.distinct('userId', { userId: { $exists: true } });
        return { $nin: orderedUsers };
      }
      case 'active': {
        // Active: Order in last 60 days
        const activeCutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const activeUsers = await Order.distinct('userId', { createdAt: { $gte: activeCutoff } });
        return { $in: activeUsers.filter(id => mongoose.Types.ObjectId.isValid(id)) };
      }
      case 'at_risk': {
        // At Risk: Had orders previously, but no order between 60 and 180 days
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const recentBuyers = await Order.distinct('userId', { createdAt: { $gte: sixtyDaysAgo } });
        const pastBuyers = await Order.distinct('userId', { createdAt: { $lt: sixtyDaysAgo } });
        const atRiskIds = pastBuyers.filter(id => !recentBuyers.includes(id) && mongoose.Types.ObjectId.isValid(id));
        return { $in: atRiskIds };
      }
      case 'churned': {
        // Churned: No order for > 180 days
        const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        const recentBuyers = await Order.distinct('userId', { createdAt: { $gte: oneEightyDaysAgo } });
        const allBuyers = await Order.distinct('userId', { userId: { $exists: true } });
        const churnedIds = allBuyers.filter(id => !recentBuyers.includes(id) && mongoose.Types.ObjectId.isValid(id));
        return { $in: churnedIds };
      }
      default:
        return null;
    }
  }

  /**
   * Fast, accurate audience estimation with full exclusion breakdown
   */
  public static async estimateAudience(
    filter: IAudienceFilter = {},
    channel: 'email' | 'whatsapp'
  ): Promise<IAudienceCountResult> {
    const mongoQuery = await this.buildMongoQuery(filter);

    // Fetch candidate users with minimum projection to preserve RAM
    const candidateUsers = await User.find(mongoQuery)
      .select('_id name email phone notificationPreferences')
      .lean();

    const totalMatched = candidateUsers.length;
    if (totalMatched === 0) {
      return {
        totalMatched: 0,
        eligible: 0,
        suppressed: 0,
        missingContact: 0,
        optedOut: 0,
        exclusionBreakdown: { missingContact: 0, suppressed: 0, notificationPreferenceOptOut: 0 },
      };
    }

    // Step 1: Check contact availability and notification opt-out
    const validContactCandidates: any[] = [];
    let missingContact = 0;
    let optedOut = 0;

    for (const u of candidateUsers) {
      const hasContact = channel === 'email' ? Boolean(u.email && u.email.includes('@')) : Boolean(u.phone && u.phone.replace(/\D/g, '').length >= 10);
      if (!hasContact) {
        missingContact++;
        continue;
      }

      if (filter.respectNotificationPreferences !== false) {
        const prefs = u.notificationPreferences || {};
        if (channel === 'email' && prefs.emailReminders === false) {
          optedOut++;
          continue;
        }
        if (channel === 'whatsapp' && prefs.whatsappReminders === false) {
          optedOut++;
          continue;
        }
      }

      validContactCandidates.push(u);
    }

    // Step 2: Check suppression table
    let suppressedCount = 0;
    let eligible = validContactCandidates.length;

    if (filter.respectSuppression !== false && validContactCandidates.length > 0) {
      const identifiers = validContactCandidates.map(u => (channel === 'email' ? u.email : u.phone));
      const suppressedSet = await SuppressionService.getSuppressedSet(identifiers, channel);
      suppressedCount = suppressedSet.size;
      eligible = Math.max(0, validContactCandidates.length - suppressedCount);
    }

    return {
      totalMatched,
      eligible,
      suppressed: suppressedCount,
      missingContact,
      optedOut,
      exclusionBreakdown: {
        missingContact,
        suppressed: suppressedCount,
        notificationPreferenceOptOut: optedOut,
      },
    };
  }

  /**
   * Preview a sample of recipients with resolved template variables and eligibility tags
   */
  public static async previewAudience(
    filter: IAudienceFilter = {},
    channel: 'email' | 'whatsapp',
    limit = 10
  ): Promise<IAudiencePreviewRecipient[]> {
    const mongoQuery = await this.buildMongoQuery(filter);

    const users = await User.find(mongoQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (users.length === 0) return [];

    const identifiers = users
      .map(u => (channel === 'email' ? u.email : u.phone))
      .filter((id): id is string => Boolean(id));
    const suppressedSet = await SuppressionService.getSuppressedSet(identifiers, channel);

    const previews: IAudiencePreviewRecipient[] = [];

    for (const u of users) {
      const contactVal = channel === 'email' ? u.email : u.phone;
      const hasContact = channel === 'email' ? Boolean(u.email && u.email.includes('@')) : Boolean(u.phone && u.phone.replace(/\D/g, '').length >= 10);

      let isEligible = true;
      let ineligibilityReason: string | undefined;

      if (!hasContact) {
        isEligible = false;
        ineligibilityReason = channel === 'email' ? 'Missing or invalid email' : 'Missing or invalid phone number';
      } else if (filter.respectNotificationPreferences !== false) {
        const prefs = (u as any).notificationPreferences || {};
        if (channel === 'email' && prefs.emailReminders === false) {
          isEligible = false;
          ineligibilityReason = 'Opted out in customer profile';
        } else if (channel === 'whatsapp' && prefs.whatsappReminders === false) {
          isEligible = false;
          ineligibilityReason = 'Opted out in customer profile';
        }
      }

      if (isEligible && contactVal && suppressedSet.has(SuppressionService.normalizeIdentifier(contactVal, channel))) {
        isEligible = false;
        ineligibilityReason = 'Recipient is suppressed (Unsubscribe / DNC)';
      }

      const sampleVariables = TemplateVariableRegistry.buildRecipientVariables(u);

      previews.push({
        userId: String(u._id),
        name: u.name || 'Valued Customer',
        email: u.email || '',
        phone: u.phone || '',
        isEligible,
        ineligibilityReason,
        sampleVariables,
      });
    }

    return previews;
  }
}
