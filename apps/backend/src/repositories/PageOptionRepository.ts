// apps/backend/src/repositories/PageOptionRepository.ts
import mongoose from 'mongoose';
import { PageOption, IPageOption } from '../db/models/PageOption';
import { pageCountOptions, PageOptionItem } from '../data/templates';
import { isDbConnected } from '../db/connection';
import { cacheGet, cacheSet, cacheDel, cacheDelByPrefix } from '../cache/redis';
import { logger } from '../utils/logger';

// In-memory working copy
let inMemPageOptions: PageOptionItem[] = [...pageCountOptions];

export class PageOptionRepository {
  /**
   * Find all page options (filtered by active status if requested, ordered by displayOrder)
   */
  public static async findAll(onlyActive: boolean = true): Promise<any[]> {
    const cacheKey = `page-options:${onlyActive ? 'active' : 'all'}`;
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    try {
      if (isDbConnected()) {
        const query: any = onlyActive ? { isActive: true } : {};
        const items = await (PageOption as any).find(query).sort({ displayOrder: 1, count: 1 });
        if (items && items.length > 0) {
          const formatted = items.map((item: any) => ({
            id: item._id.toString(),
            pageOptionId: item.pageOptionId,
            count: item.count,
            name: item.name,
            photos: item.photos,
            badge: item.badge || '',
            priceAdjustment: item.priceAdjustment,
            description: item.description,
            isDefault: item.isDefault,
            default: item.isDefault,
            isActive: item.isActive,
            displayOrder: item.displayOrder,
          }));
          await cacheSet(cacheKey, formatted, 300);
          return formatted;
        }
      }
    } catch (err: any) {
      logger.error('Error querying PageOptions from DB:', err.message);
    }

    // In-memory fallback
    const result = (onlyActive ? inMemPageOptions.filter((o) => o.isActive !== false) : inMemPageOptions)
      .slice()
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    await cacheSet(cacheKey, result, 300);
    return result;
  }

  /**
   * Find single page option by MongoDB ID, pageOptionId, or count
   */
  public static async findById(identifier: string): Promise<any | null> {
    try {
      if (isDbConnected()) {
        let query: any = { pageOptionId: identifier };
        if (mongoose.isValidObjectId(identifier)) {
          query = { $or: [{ _id: identifier }, { pageOptionId: identifier }] };
        } else if (!isNaN(Number(identifier))) {
          query = { $or: [{ count: Number(identifier) }, { pageOptionId: identifier }] };
        }
        const found = await (PageOption as any).findOne(query);
        if (found) {
          return {
            id: found._id.toString(),
            pageOptionId: found.pageOptionId,
            count: found.count,
            name: found.name,
            photos: found.photos,
            badge: found.badge || '',
            priceAdjustment: found.priceAdjustment,
            description: found.description,
            isDefault: found.isDefault,
            default: found.isDefault,
            isActive: found.isActive,
            displayOrder: found.displayOrder,
          };
        }
      }
    } catch (err: any) {
      logger.error('Error finding PageOption:', err.message);
    }

    const inMem = inMemPageOptions.find(
      (o) =>
        o.pageOptionId === identifier ||
        o.id === identifier ||
        o.count === Number(identifier)
    );
    return inMem || null;
  }

  /**
   * Create a new page option
   */
  public static async create(data: Partial<PageOptionItem>): Promise<any> {
    await this.clearCache();

    const count = Number(data.count) || 32;
    const pageOptionId = data.pageOptionId || `pages-${count}`;
    const name = data.name || `${count} Pages`;
    const photos = Number(data.photos) || count;
    const badge = data.badge ? data.badge.trim() : '';
    const priceAdjustment = Number(data.priceAdjustment) || 0;
    const description =
      data.description ||
      `${photos} photo slots (1 photo per page). Fine-art layflat keepsake.`;
    const isDefault = Boolean(data.isDefault || data.default);
    const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
    const displayOrder = Number(data.displayOrder) || (inMemPageOptions.length + 1);

    // If marked default, unset others
    if (isDefault) {
      await this.unsetDefault();
    }

    if (isDbConnected()) {
      try {
        const created: any = await (PageOption as any).create({
          pageOptionId,
          count,
          name,
          photos,
          badge,
          priceAdjustment,
          description,
          isDefault,
          isActive,
          displayOrder,
        });
        if (created) {
          return {
            id: created._id.toString(),
            pageOptionId: created.pageOptionId,
            count: created.count,
            name: created.name,
            photos: created.photos,
            badge: created.badge,
            priceAdjustment: created.priceAdjustment,
            description: created.description,
            isDefault: created.isDefault,
            default: created.isDefault,
            isActive: created.isActive,
            displayOrder: created.displayOrder,
          };
        }
      } catch (err: any) {
        logger.error('Error creating PageOption in DB:', err.message);
      }
    }

    const newOption: PageOptionItem = {
      id: `po-${Date.now()}`,
      pageOptionId,
      count,
      name,
      photos,
      badge,
      priceAdjustment,
      description,
      isDefault,
      default: isDefault,
      isActive,
      displayOrder,
    };

    inMemPageOptions.push(newOption);
    return newOption;
  }

  /**
   * Update existing page option
   */
  public static async update(identifier: string, data: Partial<PageOptionItem>): Promise<any | null> {
    await this.clearCache();

    const isDefault = data.isDefault !== undefined ? Boolean(data.isDefault) : (data.default !== undefined ? Boolean(data.default) : undefined);

    if (isDefault) {
      await this.unsetDefault();
    }

    if (isDbConnected()) {
      try {
        let filter: any = { pageOptionId: identifier };
        if (mongoose.isValidObjectId(identifier)) {
          filter = { $or: [{ _id: identifier }, { pageOptionId: identifier }] };
        } else if (!isNaN(Number(identifier))) {
          filter = { $or: [{ count: Number(identifier) }, { pageOptionId: identifier }] };
        }

        const updateFields: any = { ...data };
        if (isDefault !== undefined) {
          updateFields.isDefault = isDefault;
        }
        if (updateFields.count) updateFields.count = Number(updateFields.count);
        if (updateFields.photos) updateFields.photos = Number(updateFields.photos);
        if (updateFields.priceAdjustment !== undefined) updateFields.priceAdjustment = Number(updateFields.priceAdjustment);
        if (updateFields.displayOrder !== undefined) updateFields.displayOrder = Number(updateFields.displayOrder);

        const updated: any = await (PageOption as any).findOneAndUpdate(filter, updateFields, { new: true });
        if (updated) {
          return {
            id: updated._id.toString(),
            pageOptionId: updated.pageOptionId,
            count: updated.count,
            name: updated.name,
            photos: updated.photos,
            badge: updated.badge,
            priceAdjustment: updated.priceAdjustment,
            description: updated.description,
            isDefault: updated.isDefault,
            default: updated.isDefault,
            isActive: updated.isActive,
            displayOrder: updated.displayOrder,
          };
        }
      } catch (err: any) {
        logger.error('Error updating PageOption in DB:', err.message);
      }
    }

    const index = inMemPageOptions.findIndex(
      (o) =>
        o.pageOptionId === identifier ||
        o.id === identifier ||
        o.count === Number(identifier)
    );

    if (index === -1) return null;

    const existing = inMemPageOptions[index]!;
    const updatedOption: PageOptionItem = {
      ...existing,
      ...data,
      count: data.count !== undefined ? Number(data.count) : existing.count,
      photos: data.photos !== undefined ? Number(data.photos) : existing.photos,
      priceAdjustment: data.priceAdjustment !== undefined ? Number(data.priceAdjustment) : existing.priceAdjustment,
      isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
      default: isDefault !== undefined ? isDefault : existing.default,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : existing.displayOrder,
    };

    inMemPageOptions[index] = updatedOption;
    return updatedOption;
  }

  /**
   * Delete or deactivate page option
   */
  public static async delete(identifier: string): Promise<boolean> {
    await this.clearCache();

    if (isDbConnected()) {
      try {
        let filter: any = { pageOptionId: identifier };
        if (mongoose.isValidObjectId(identifier)) {
          filter = { $or: [{ _id: identifier }, { pageOptionId: identifier }] };
        } else if (!isNaN(Number(identifier))) {
          filter = { $or: [{ count: Number(identifier) }, { pageOptionId: identifier }] };
        }
        const res = await (PageOption as any).findOneAndDelete(filter);
        if (res) return true;
      } catch (err: any) {
        logger.error('Error deleting PageOption in DB:', err.message);
      }
    }

    const index = inMemPageOptions.findIndex(
      (o) =>
        o.pageOptionId === identifier ||
        o.id === identifier ||
        o.count === Number(identifier)
    );

    if (index !== -1) {
      inMemPageOptions.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Reset page options to default schema
   */
  public static async resetToDefaults(): Promise<any[]> {
    await this.clearCache();

    if (isDbConnected()) {
      try {
        await (PageOption as any).deleteMany({});
        for (const item of pageCountOptions) {
          await (PageOption as any).create(item);
        }
      } catch (err: any) {
        logger.error('Error resetting PageOptions in DB:', err.message);
      }
    }

    inMemPageOptions = [...pageCountOptions];
    return inMemPageOptions;
  }

  /**
   * Ensure only one default exists
   */
  private static async unsetDefault() {
    if (isDbConnected()) {
      try {
        await (PageOption as any).updateMany({}, { isDefault: false });
      } catch (err: any) {
        logger.error('Error unsetting default in DB:', err.message);
      }
    }
    inMemPageOptions.forEach((o) => {
      o.isDefault = false;
      o.default = false;
    });
  }

  /**
   * Invalidate Redis cache
   */
  private static async clearCache() {
    await cacheDelByPrefix('page-options:');
    await cacheDel('products:config');
  }
}

export default PageOptionRepository;
