// apps/backend/src/services/PageOptionService.ts
import { PageOptionRepository } from '../repositories/PageOptionRepository';
import { ApiError } from '../utils/apiError';

export class PageOptionService {
  public static async getPageOptions(onlyActive: boolean = true) {
    return await PageOptionRepository.findAll(onlyActive);
  }

  public static async getPageOptionById(identifier: string) {
    const item = await PageOptionRepository.findById(identifier);
    if (!item) {
      throw ApiError.notFound(`Page option '${identifier}' not found.`);
    }
    return item;
  }

  public static async createPageOption(data: any) {
    if (!data.count || isNaN(Number(data.count)) || Number(data.count) <= 0) {
      throw ApiError.badRequest('Valid page count is required (must be a positive number).');
    }

    const count = Number(data.count);
    const existing = await PageOptionRepository.findById(String(count));
    if (existing) {
      throw ApiError.conflict(`A page option with ${count} pages already exists.`);
    }

    return await PageOptionRepository.create({
      count,
      name: data.name || `${count} Pages`,
      photos: Number(data.photos) || count, // Defaults to 1 photo per page
      badge: data.badge ? String(data.badge).trim() : '',
      priceAdjustment: Number(data.priceAdjustment) || 0,
      description: data.description || `${count} photo slots (1 photo per page). Archival fine-art layflat edition.`,
      isDefault: Boolean(data.isDefault || data.default),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      displayOrder: Number(data.displayOrder) || 10,
    });
  }

  public static async updatePageOption(identifier: string, data: any) {
    const existing = await PageOptionRepository.findById(identifier);
    if (!existing) {
      throw ApiError.notFound(`Page option '${identifier}' not found.`);
    }

    const updated = await PageOptionRepository.update(identifier, data);
    return updated;
  }

  public static async deletePageOption(identifier: string) {
    const existing = await PageOptionRepository.findById(identifier);
    if (!existing) {
      throw ApiError.notFound(`Page option '${identifier}' not found.`);
    }

    const deleted = await PageOptionRepository.delete(identifier);
    return deleted;
  }

  public static async resetDefaults() {
    return await PageOptionRepository.resetToDefaults();
  }
}

export default PageOptionService;
