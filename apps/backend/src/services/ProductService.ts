// apps/backend/src/services/ProductService.ts
import { ProductRepository } from '../repositories/ProductRepository';
import { ApiError } from '../utils/apiError';

export class ProductService {
  public static async getProducts(filter: { category?: string; search?: string; tag?: string; limit?: number; skip?: number; page?: number }) {
    return await ProductRepository.findAll(filter);
  }

  public static async getProductBySlugOrId(slugParam: string) {
    const product = await ProductRepository.findBySlugOrId(slugParam);
    if (!product) {
      throw ApiError.notFound(`Photobook with identifier '${slugParam}' not found.`);
    }
    return product;
  }

  public static async getFeatured() {
    return await ProductRepository.findFeatured();
  }

  public static getCategories() {
    return ProductRepository.getCategories();
  }

  public static async getConfig() {
    return await ProductRepository.getConfig();
  }

  public static async createProduct(body: any) {
    if (!body.displayName && !body.title) {
      throw ApiError.badRequest('Book title or display name is required.');
    }

    const titleStr = body.displayName || body.title;
    const slug =
      body.slug ||
      titleStr
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
        '-' +
        Math.floor(100 + Math.random() * 900);

    const fromPrice = Number(body.fromPrice) || 1999;
    const productData = {
      slug,
      seriesLabel: body.seriesLabel || 'travel series',
      bookType: body.bookType || 'custom photobook',
      title: body.title || body.displayName || 'custom photobook',
      displayName: body.displayName || body.title || 'New Photobook',
      tagline: body.tagline || 'your journeys, perfectly told',
      subtitle: body.subtitle || '',
      description: body.description || '',
      category: body.category || 'Travel',
      coverImage:
        body.coverImage ||
        'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
      coverColor: body.coverColor || '#F8BAC7',
      spineText: body.spineText || 'PHOTOBOOK',
      rating: Number(body.rating) || 5.0,
      reviewCount: Number(body.reviewCount) || 72,
      fromPrice,
      pricing: body.pricing || { '8.25': fromPrice, '10': fromPrice + 500 },
      basePages: Number(body.basePages) || 40,
      maxPhotos: Number(body.maxPhotos) || 100,
      badge: body.badge || '',
      featured: body.featured ?? true,
      tags: Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : [],
      pageOptions:
        Array.isArray(body.pageOptions) && body.pageOptions.length > 0
          ? body.pageOptions
          : [12, 24, 32, 60, 120],
      defaultOptions: body.defaultOptions || {
        size: '8.25x8.25',
        cover: 'cov-1',
        theme: 'theme-4',
        color: 'col-1',
        packaging: 'pack-1',
      },
      templatePhotos:
        body.templatePhotos && body.templatePhotos.length > 0
          ? body.templatePhotos
          : [
              body.coverImage ||
                'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
            ],
    };

    return await ProductRepository.create(productData);
  }

  public static async updateProduct(idParam: string, body: any) {
    const updateData = { ...body };
    if (typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags
        .split(',')
        .map((t: string) => t.trim().toLowerCase())
        .filter(Boolean);
    }
    if (updateData.fromPrice) {
      updateData.fromPrice = Number(updateData.fromPrice);
      if (!updateData.pricing) {
        updateData.pricing = { '8.25': updateData.fromPrice, '10': updateData.fromPrice + 500 };
      }
    }

    const updated = await ProductRepository.update(idParam, updateData);
    if (!updated) {
      throw ApiError.notFound(`Product with ID '${idParam}' not found.`);
    }
    return updated;
  }

  public static async deleteProduct(idParam: string) {
    const deleted = await ProductRepository.delete(idParam);
    if (!deleted) {
      throw ApiError.notFound(`Product with ID '${idParam}' not found.`);
    }
    return deleted;
  }
}

export default ProductService;
