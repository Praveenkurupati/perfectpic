// apps/backend/src/repositories/BundleRepository.ts
import mongoose from 'mongoose';
import { BundleTier, IBundleTier } from '../db/models/BundleTier';
import { defaultBundleTiers, BundleTierItem } from '../data/bundles';
import { isDbConnected } from '../db/connection';
import { cacheGet, cacheSet, cacheDelByPrefix } from '../cache/redis';
import { logger } from '../utils/logger';

// In-memory working copy for offline or DB fallback
let inMemBundleTiers: BundleTierItem[] = [...defaultBundleTiers];

function formatBundleTier(item: any): BundleTierItem {
  return {
    id: item._id ? item._id.toString() : item.id,
    bundleId: item.bundleId,
    minQuantity: item.minQuantity,
    name: item.name,
    price: item.price ?? 1999,
    perBookPrice: item.perBookPrice ?? Math.round((item.price ?? 1999) / (item.minQuantity || 1)),
    discountAmount: item.discountAmount ?? 0,
    netPrice: item.netPrice ?? 0,
    printCost: item.printCost ?? 0,
    shippingCost: item.shippingCost ?? 0,
    grossProfit: item.grossProfit ?? 0,
    marginPerBook: item.marginPerBook ?? 0,
    marginPercentage: item.marginPercentage ?? 0,
    freeShipping: item.freeShipping !== false,
    badge: item.badge || '',
    description: item.description || '',
    isActive: item.isActive !== false,
    displayOrder: item.displayOrder || 0,
  };
}

function computeUnitEconomics(data: Partial<BundleTierItem>): BundleTierItem {
  const minQty = Math.max(1, Number(data.minQuantity) || 1);
  const price = data.price !== undefined ? Number(data.price) : (minQty === 1 ? 1999 : minQty === 2 ? 3499 : minQty === 4 ? 6399 : minQty === 6 ? 8999 : minQty * 1999);
  const perBookPrice = data.perBookPrice !== undefined ? Number(data.perBookPrice) : Math.round(price / minQty);
  const discountAmount = data.discountAmount !== undefined ? Number(data.discountAmount) : Math.max(0, minQty * 1999 - price);
  const netPrice = data.netPrice !== undefined ? Number(data.netPrice) : Math.round(price * 0.8694);
  const printCost = data.printCost !== undefined ? Number(data.printCost) : (minQty * 515);
  const shippingCost = data.shippingCost !== undefined ? Number(data.shippingCost) : (minQty === 1 ? 110 : minQty === 2 ? 150 : minQty === 4 ? 240 : 330);
  const grossProfit = data.grossProfit !== undefined ? Number(data.grossProfit) : (netPrice - printCost - shippingCost);
  const marginPerBook = data.marginPerBook !== undefined ? Number(data.marginPerBook) : Math.round(grossProfit / minQty);
  const marginPercentage = data.marginPercentage !== undefined ? Number(data.marginPercentage) : (price > 0 ? Math.round((grossProfit / price) * 1000) / 10 : 0);

  return {
    bundleId: data.bundleId || `bundle-${minQty}`,
    minQuantity: minQty,
    name: data.name || `${minQty} Books Pack`,
    price,
    perBookPrice,
    discountAmount,
    netPrice,
    printCost,
    shippingCost,
    grossProfit,
    marginPerBook,
    marginPercentage,
    freeShipping: data.freeShipping !== false,
    badge: data.badge || '',
    description: data.description || '',
    isActive: data.isActive !== false,
    displayOrder: Number(data.displayOrder) || minQty,
  };
}

export class BundleRepository {
  /**
   * Find all bundle tiers (filtered by active status if requested, ordered by minQuantity)
   */
  public static async findAll(onlyActive: boolean = true): Promise<BundleTierItem[]> {
    const cacheKey = `bundle-tiers:${onlyActive ? 'active' : 'all'}`;
    const cached = await cacheGet<BundleTierItem[]>(cacheKey);
    if (cached) return cached;

    try {
      if (isDbConnected()) {
        const query: any = onlyActive ? { isActive: true } : {};
        const items = await (BundleTier as any).find(query).sort({ minQuantity: 1, displayOrder: 1 });
        if (items && items.length > 0) {
          const formatted = items.map(formatBundleTier);
          await cacheSet(cacheKey, formatted, 300);
          return formatted;
        }
      }
    } catch (err: any) {
      logger.error('Error querying BundleTiers from DB:', err.message);
    }

    // In-memory fallback
    const result = (onlyActive ? inMemBundleTiers.filter((b) => b.isActive !== false) : inMemBundleTiers)
      .slice()
      .sort((a, b) => a.minQuantity - b.minQuantity);

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  /**
   * Find single bundle tier by ID, bundleId, or minQuantity
   */
  public static async findById(identifier: string): Promise<BundleTierItem | null> {
    try {
      if (isDbConnected()) {
        let query: any = { bundleId: identifier };
        if (mongoose.isValidObjectId(identifier)) {
          query = { $or: [{ _id: identifier }, { bundleId: identifier }] };
        } else if (!isNaN(Number(identifier))) {
          query = { $or: [{ minQuantity: Number(identifier) }, { bundleId: identifier }] };
        }
        const found = await (BundleTier as any).findOne(query);
        if (found) {
          return formatBundleTier(found);
        }
      }
    } catch (err: any) {
      logger.error('Error finding BundleTier:', err.message);
    }

    const inMem = inMemBundleTiers.find(
      (b) =>
        b.bundleId === identifier ||
        b.id === identifier ||
        b.minQuantity === Number(identifier)
    );
    return inMem || null;
  }

  /**
   * Create new bundle tier
   */
  public static async create(data: Partial<BundleTierItem>): Promise<BundleTierItem> {
    const cleanData = computeUnitEconomics(data);

    try {
      if (isDbConnected()) {
        const created = await (BundleTier as any).create(cleanData);
        await cacheDelByPrefix('bundle-tiers:');
        return formatBundleTier(created);
      }
    } catch (err: any) {
      logger.error('Error creating BundleTier in DB:', err.message);
    }

    // In-memory creation
    const itemWithId = { ...cleanData, id: `inmem-${Date.now()}` };
    inMemBundleTiers.push(itemWithId);
    await cacheDelByPrefix('bundle-tiers:');
    return itemWithId;
  }

  /**
   * Update existing bundle tier
   */
  public static async update(identifier: string, updates: Partial<BundleTierItem>): Promise<BundleTierItem | null> {
    // If pricing or costs changed, recalculate unit economics fields
    const existing = await this.findById(identifier);
    const updatesCopy = { ...updates };
    const shouldRecompute =
      (updates.price !== undefined || updates.netPrice !== undefined || updates.printCost !== undefined || updates.shippingCost !== undefined) &&
      updates.grossProfit === undefined;

    const merged = { ...(existing || {}), ...updatesCopy };
    if (shouldRecompute) {
      delete (merged as any).grossProfit;
      delete (merged as any).marginPerBook;
      delete (merged as any).marginPercentage;
      delete (merged as any).perBookPrice;
      delete (merged as any).discountAmount;
    }
    const cleanUpdates = computeUnitEconomics(merged);

    try {
      if (isDbConnected()) {
        let query: any = { bundleId: identifier };
        if (mongoose.isValidObjectId(identifier)) {
          query = { $or: [{ _id: identifier }, { bundleId: identifier }] };
        } else if (!isNaN(Number(identifier))) {
          query = { $or: [{ minQuantity: Number(identifier) }, { bundleId: identifier }] };
        }

        const updated = await (BundleTier as any).findOneAndUpdate(
          query,
          { $set: cleanUpdates },
          { new: true, runValidators: true }
        );

        if (updated) {
          await cacheDelByPrefix('bundle-tiers:');
          return formatBundleTier(updated);
        }
      }
    } catch (err: any) {
      logger.error('Error updating BundleTier in DB:', err.message);
    }

    // In-memory update
    const idx = inMemBundleTiers.findIndex(
      (b) =>
        b.bundleId === identifier ||
        b.id === identifier ||
        b.minQuantity === Number(identifier)
    );

    if (idx !== -1 && inMemBundleTiers[idx]) {
      inMemBundleTiers[idx] = {
        ...inMemBundleTiers[idx]!,
        ...cleanUpdates,
      };
      await cacheDelByPrefix('bundle-tiers:');
      return inMemBundleTiers[idx];
    }

    return null;
  }

  /**
   * Delete bundle tier
   */
  public static async delete(identifier: string): Promise<boolean> {
    try {
      if (isDbConnected()) {
        let query: any = { bundleId: identifier };
        if (mongoose.isValidObjectId(identifier)) {
          query = { $or: [{ _id: identifier }, { bundleId: identifier }] };
        } else if (!isNaN(Number(identifier))) {
          query = { $or: [{ minQuantity: Number(identifier) }, { bundleId: identifier }] };
        }

        const res = await (BundleTier as any).deleteOne(query);
        if (res.deletedCount > 0) {
          await cacheDelByPrefix('bundle-tiers:');
          return true;
        }
      }
    } catch (err: any) {
      logger.error('Error deleting BundleTier in DB:', err.message);
    }

    // In-memory delete
    const prevLen = inMemBundleTiers.length;
    inMemBundleTiers = inMemBundleTiers.filter(
      (b) =>
        b.bundleId !== identifier &&
        b.id !== identifier &&
        b.minQuantity !== Number(identifier)
    );

    await cacheDelByPrefix('bundle-tiers:');
    return inMemBundleTiers.length < prevLen;
  }

  /**
   * Reset to factory default bundle tiers (1, 2, 4, 6 books)
   */
  public static async resetDefaults(): Promise<BundleTierItem[]> {
    try {
      if (isDbConnected()) {
        await (BundleTier as any).deleteMany({});
        const seeded = await (BundleTier as any).insertMany(defaultBundleTiers);
        await cacheDelByPrefix('bundle-tiers:');
        return seeded.map(formatBundleTier);
      }
    } catch (err: any) {
      logger.error('Error resetting BundleTiers in DB:', err.message);
    }

    inMemBundleTiers = [...defaultBundleTiers];
    await cacheDelByPrefix('bundle-tiers:');
    return inMemBundleTiers;
  }

  /**
   * Seed or migrate bundle tiers in MongoDB Atlas on startup
   */
  public static async seedDefaultsIfEmpty(): Promise<void> {
    if (!isDbConnected()) return;
    try {
      const existing = await (BundleTier as any).find({});
      if (!existing || existing.length === 0) {
        logger.info('🌱 Seeding initial 4 authoritative bundle tiers into MongoDB...');
        await (BundleTier as any).insertMany(defaultBundleTiers);
        await cacheDelByPrefix('bundle-tiers:');
        logger.info('✅ Initial 4 bundle tiers seeded successfully into MongoDB!');
        return;
      }

      // Check for legacy schema or obsolete tiers (e.g. bundle-3, bundle-12, or missing price field)
      const hasObsolete = existing.some(
        (t: any) => t.bundleId === 'bundle-3' || t.bundleId === 'bundle-12' || !t.price
      );
      if (hasObsolete) {
        logger.info('🔄 Migrating bundle tiers to 4 authoritative unit economics tiers in MongoDB...');
        await (BundleTier as any).deleteMany({});
        await (BundleTier as any).insertMany(defaultBundleTiers);
        await cacheDelByPrefix('bundle-tiers:');
        logger.info('✅ Bundle tiers successfully migrated to authoritative 4 tiers in MongoDB!');
      }
    } catch (err: any) {
      logger.error('Error seeding/migrating initial bundle tiers:', err.message);
    }
  }
}
