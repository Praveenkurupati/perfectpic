// apps/backend/src/repositories/BundleRepository.ts
import mongoose from 'mongoose';
import { BundleTier, IBundleTier } from '../db/models/BundleTier';
import { defaultBundleTiers, BundleTierItem } from '../data/bundles';
import { isDbConnected } from '../db/connection';
import { cacheGet, cacheSet, cacheDelByPrefix } from '../cache/redis';
import { logger } from '../utils/logger';

// In-memory working copy for offline or DB fallback
let inMemBundleTiers: BundleTierItem[] = [...defaultBundleTiers];

export class BundleRepository {
  /**
   * Find all bundle tiers (filtered by active status if requested, ordered by minQuantity)
   */
  public static async findAll(onlyActive: boolean = true): Promise<any[]> {
    const cacheKey = `bundle-tiers:${onlyActive ? 'active' : 'all'}`;
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    try {
      if (isDbConnected()) {
        const query: any = onlyActive ? { isActive: true } : {};
        const items = await (BundleTier as any).find(query).sort({ minQuantity: 1, displayOrder: 1 });
        if (items && items.length > 0) {
          const formatted = items.map((item: any) => ({
            id: item._id.toString(),
            bundleId: item.bundleId,
            minQuantity: item.minQuantity,
            name: item.name,
            discountAmount: item.discountAmount,
            freeShipping: item.freeShipping !== false,
            badge: item.badge || '',
            description: item.description || '',
            isActive: item.isActive !== false,
            displayOrder: item.displayOrder || 0,
          }));
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
  public static async findById(identifier: string): Promise<any | null> {
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
          return {
            id: found._id.toString(),
            bundleId: found.bundleId,
            minQuantity: found.minQuantity,
            name: found.name,
            discountAmount: found.discountAmount,
            freeShipping: found.freeShipping !== false,
            badge: found.badge || '',
            description: found.description || '',
            isActive: found.isActive !== false,
            displayOrder: found.displayOrder || 0,
          };
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
  public static async create(data: Partial<BundleTierItem>): Promise<any> {
    const bundleId = data.bundleId || `bundle-${data.minQuantity || Date.now()}`;
    const cleanData: BundleTierItem = {
      bundleId,
      minQuantity: Number(data.minQuantity) || 3,
      name: data.name || `${data.minQuantity} Books Pack`,
      discountAmount: Number(data.discountAmount) || 0,
      freeShipping: data.freeShipping !== false,
      badge: data.badge || '',
      description: data.description || '',
      isActive: data.isActive !== false,
      displayOrder: Number(data.displayOrder) || inMemBundleTiers.length + 1,
    };

    try {
      if (isDbConnected()) {
        const created = await (BundleTier as any).create(cleanData);
        await cacheDelByPrefix('bundle-tiers:');
        return {
          id: created._id.toString(),
          bundleId: created.bundleId,
          minQuantity: created.minQuantity,
          name: created.name,
          discountAmount: created.discountAmount,
          freeShipping: created.freeShipping,
          badge: created.badge,
          description: created.description,
          isActive: created.isActive,
          displayOrder: created.displayOrder,
        };
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
  public static async update(identifier: string, updates: Partial<BundleTierItem>): Promise<any | null> {
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
          { $set: updates },
          { new: true, runValidators: true }
        );

        if (updated) {
          await cacheDelByPrefix('bundle-tiers:');
          return {
            id: updated._id.toString(),
            bundleId: updated.bundleId,
            minQuantity: updated.minQuantity,
            name: updated.name,
            discountAmount: updated.discountAmount,
            freeShipping: updated.freeShipping,
            badge: updated.badge,
            description: updated.description,
            isActive: updated.isActive,
            displayOrder: updated.displayOrder,
          };
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
      const existing = inMemBundleTiers[idx]!;
      inMemBundleTiers[idx] = {
        ...existing,
        ...updates,
        bundleId: updates.bundleId || existing.bundleId,
        minQuantity: updates.minQuantity ?? existing.minQuantity,
        name: updates.name || existing.name,
        discountAmount: updates.discountAmount ?? existing.discountAmount,
        freeShipping: updates.freeShipping ?? existing.freeShipping,
        description: updates.description ?? existing.description,
        isActive: updates.isActive ?? existing.isActive,
        displayOrder: updates.displayOrder ?? existing.displayOrder,
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
   * Reset to factory default bundle tiers
   */
  public static async resetDefaults(): Promise<any[]> {
    try {
      if (isDbConnected()) {
        await (BundleTier as any).deleteMany({});
        const seeded = await (BundleTier as any).insertMany(defaultBundleTiers);
        await cacheDelByPrefix('bundle-tiers:');
        return seeded.map((item: any) => ({
          id: item._id.toString(),
          bundleId: item.bundleId,
          minQuantity: item.minQuantity,
          name: item.name,
          discountAmount: item.discountAmount,
          freeShipping: item.freeShipping,
          badge: item.badge,
          description: item.description,
          isActive: item.isActive,
          displayOrder: item.displayOrder,
        }));
      }
    } catch (err: any) {
      logger.error('Error resetting BundleTiers in DB:', err.message);
    }

    inMemBundleTiers = [...defaultBundleTiers];
    await cacheDelByPrefix('bundle-tiers:');
    return inMemBundleTiers;
  }
}
