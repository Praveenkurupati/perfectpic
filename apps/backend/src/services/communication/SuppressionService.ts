// apps/backend/src/services/communication/SuppressionService.ts
import { SuppressionEntry, SuppressionChannel, SuppressionReason, ISuppressionEntry } from '../../db/models/SuppressionEntry';
import { logger } from '../../utils/logger';

export interface ISuppressionCheckResult {
  suppressed: boolean;
  reason?: SuppressionReason;
  suppressedAt?: Date;
}

export class SuppressionService {
  /**
   * Normalizes an identifier (lowercases email, strips non-digits for phone)
   */
  public static normalizeIdentifier(identifier: string, channel: 'email' | 'whatsapp'): string {
    if (!identifier) return '';
    if (channel === 'email') {
      return identifier.trim().toLowerCase();
    }
    // WhatsApp: digits only
    return identifier.replace(/\D/g, '');
  }

  /**
   * Checks if an email or phone number is suppressed for a specific channel
   */
  public static async isSuppressed(
    identifier: string,
    channel: 'email' | 'whatsapp'
  ): Promise<ISuppressionCheckResult> {
    const normalized = this.normalizeIdentifier(identifier, channel);
    if (!normalized) return { suppressed: false };

    const now = new Date();
    const entry = await SuppressionEntry.findOne({
      identifier: normalized,
      channel: { $in: [channel, 'all'] },
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).lean();

    if (entry) {
      return {
        suppressed: true,
        reason: entry.reason,
        suppressedAt: entry.suppressedAt,
      };
    }

    return { suppressed: false };
  }

  /**
   * High-speed bulk check: returns a Set of suppressed normalized identifiers from an input array
   */
  public static async getSuppressedSet(
    identifiers: string[],
    channel: 'email' | 'whatsapp'
  ): Promise<Set<string>> {
    if (!identifiers || identifiers.length === 0) return new Set();

    const normalizedMap = new Map<string, string>();
    for (const id of identifiers) {
      const norm = this.normalizeIdentifier(id, channel);
      if (norm) normalizedMap.set(norm, id);
    }

    const normalizedArray = Array.from(normalizedMap.keys());
    if (normalizedArray.length === 0) return new Set();

    const now = new Date();
    const matches = await SuppressionEntry.find({
      identifier: { $in: normalizedArray },
      channel: { $in: [channel, 'all'] },
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select('identifier')
      .lean();

    return new Set(matches.map(m => m.identifier));
  }

  /**
   * Adds or updates a suppression entry
   */
  public static async suppress(params: {
    identifier: string;
    channel: SuppressionChannel;
    reason: SuppressionReason;
    campaignId?: string;
    source?: string;
    notes?: string;
    expiresAt?: Date | null;
    metadata?: Record<string, any>;
  }): Promise<ISuppressionEntry> {
    const channelForNorm = params.channel === 'whatsapp' ? 'whatsapp' : 'email';
    const normalized = this.normalizeIdentifier(params.identifier, channelForNorm);

    const doc = await SuppressionEntry.findOneAndUpdate(
      {
        identifier: normalized,
        channel: params.channel,
      },
      {
        $set: {
          identifier: normalized,
          channel: params.channel,
          reason: params.reason,
          campaignId: params.campaignId,
          source: params.source || 'admin',
          notes: params.notes || '',
          expiresAt: params.expiresAt || null,
          active: true,
          suppressedAt: new Date(),
          metadata: params.metadata || {},
        },
      },
      { upsert: true, new: true }
    );

    logger.info(`🚫 [SuppressionService] Suppressed ${normalized} for channel "${params.channel}" (Reason: ${params.reason})`);
    return doc;
  }

  /**
   * Removes or deactivates a suppression entry
   */
  public static async unsuppress(identifier: string, channel: SuppressionChannel = 'all'): Promise<boolean> {
    const channelForNorm = channel === 'whatsapp' ? 'whatsapp' : 'email';
    const normalized = this.normalizeIdentifier(identifier, channelForNorm);

    const filter: any = { identifier: normalized };
    if (channel !== 'all') {
      filter.channel = { $in: [channel, 'all'] };
    }

    const res = await SuppressionEntry.updateMany(filter, { $set: { active: false, notes: 'Manually reactivated' } });
    logger.info(`✅ [SuppressionService] Unsuppressed ${normalized} (${res.modifiedCount} entries deactivated)`);
    return res.modifiedCount > 0;
  }

  /**
   * Query suppressions with search, filters, and pagination
   */
  public static async listSuppressions(query: {
    search?: string;
    channel?: string;
    reason?: string;
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, channel, reason, activeOnly = true, page = 1, limit = 50 } = query;
    const filter: any = {};

    if (activeOnly) {
      filter.active = true;
    }
    if (channel && channel !== 'all') {
      filter.channel = { $in: [channel, 'all'] };
    }
    if (reason && reason !== 'all') {
      filter.reason = reason;
    }
    if (search && search.trim()) {
      filter.identifier = { $regex: search.trim().toLowerCase(), $options: 'i' };
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [entries, total] = await Promise.all([
      SuppressionEntry.find(filter)
        .sort({ suppressedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SuppressionEntry.countDocuments(filter),
    ]);

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Suppression analytics overview
   */
  public static async getStats() {
    const [channelStats, reasonStats, totalActive] = await Promise.all([
      SuppressionEntry.aggregate([
        { $match: { active: true } },
        { $group: { _id: '$channel', count: { $sum: 1 } } },
      ]),
      SuppressionEntry.aggregate([
        { $match: { active: true } },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
      ]),
      SuppressionEntry.countDocuments({ active: true }),
    ]);

    return {
      totalActive,
      byChannel: Object.fromEntries(channelStats.map(s => [s._id, s.count])),
      byReason: Object.fromEntries(reasonStats.map(s => [s._id, s.count])),
    };
  }
}
