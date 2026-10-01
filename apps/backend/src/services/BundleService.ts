// apps/backend/src/services/BundleService.ts
import { BundleRepository } from '../repositories/BundleRepository';
import { ApiError } from '../utils/apiError';
import { BundleTierItem } from '../data/bundles';

export class BundleService {
  /**
   * Get bundle tiers (public gets only active, admin gets all)
   */
  public static async getBundles(onlyActive: boolean = true): Promise<any[]> {
    return BundleRepository.findAll(onlyActive);
  }

  /**
   * Get single bundle tier by ID or minQuantity
   */
  public static async getBundleById(id: string): Promise<any> {
    const item = await BundleRepository.findById(id);
    if (!item) {
      throw ApiError.notFound(`Bundle tier '${id}' not found`);
    }
    return item;
  }

  /**
   * Create new bundle tier
   */
  public static async createBundle(data: Partial<BundleTierItem>): Promise<any> {
    if (!data.minQuantity || data.minQuantity < 2) {
      throw ApiError.badRequest('Minimum book quantity must be at least 2');
    }
    if (data.discountAmount === undefined || data.discountAmount < 0) {
      throw ApiError.badRequest('Discount amount cannot be negative');
    }

    const existing = await BundleRepository.findById(String(data.minQuantity));
    if (existing) {
      throw ApiError.conflict(`A bundle tier for ${data.minQuantity} books already exists`);
    }

    return BundleRepository.create(data);
  }

  /**
   * Update bundle tier
   */
  public static async updateBundle(id: string, updates: Partial<BundleTierItem>): Promise<any> {
    if (updates.minQuantity !== undefined && updates.minQuantity < 2) {
      throw ApiError.badRequest('Minimum book quantity must be at least 2');
    }
    if (updates.discountAmount !== undefined && updates.discountAmount < 0) {
      throw ApiError.badRequest('Discount amount cannot be negative');
    }

    const updated = await BundleRepository.update(id, updates);
    if (!updated) {
      throw ApiError.notFound(`Bundle tier '${id}' not found`);
    }
    return updated;
  }

  /**
   * Delete bundle tier
   */
  public static async deleteBundle(id: string): Promise<boolean> {
    const deleted = await BundleRepository.delete(id);
    if (!deleted) {
      throw ApiError.notFound(`Bundle tier '${id}' not found`);
    }
    return true;
  }

  /**
   * Reset to default tiers (3 Books: ₹300, 6 Books: ₹1800, 12 Books: ₹4500)
   */
  public static async resetDefaults(): Promise<any[]> {
    return BundleRepository.resetDefaults();
  }

  /**
   * Calculate bundle discount for a given total book count
   */
  public static async calculateBundleDiscount(totalBooks: number): Promise<{
    qualifyingTier: any | null;
    discountAmount: number;
    freeShipping: boolean;
  }> {
    if (!totalBooks || totalBooks < 3) {
      return { qualifyingTier: null, discountAmount: 0, freeShipping: false };
    }

    const tiers = await BundleRepository.findAll(true);
    // Sort descending by minQuantity
    const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
    const matched = sorted.find((t) => totalBooks >= t.minQuantity);

    if (matched) {
      return {
        qualifyingTier: matched,
        discountAmount: matched.discountAmount,
        freeShipping: matched.freeShipping !== false,
      };
    }

    return { qualifyingTier: null, discountAmount: 0, freeShipping: false };
  }
}
