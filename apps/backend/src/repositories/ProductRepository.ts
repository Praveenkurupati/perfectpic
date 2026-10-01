// apps/backend/src/repositories/ProductRepository.ts
import mongoose from 'mongoose';
import { Product } from '../db/models/Product';
import {
  templates,
  categories,
  productSizes,
  coverTypes,
  bookThemes,
  bookColors,
  packagingOptions,
  pageCountOptions,
  TemplateProduct
} from '../data/templates';
import { isDbConnected } from '../db/connection';
import { cacheGet, cacheSet, cacheDelByPrefix } from '../cache/redis';
import { logger } from '../utils/logger';
import { PageOptionRepository } from './PageOptionRepository';

export class ProductRepository {
  public static async findAll(filter: { category?: string; search?: string; tag?: string }) {
    const { category, search, tag } = filter;
    const categoryKey = category && typeof category === 'string' ? category.toLowerCase() : 'all';
    const searchKey = search && typeof search === 'string' ? search.trim().toLowerCase() : '';
    const tagKey = tag && typeof tag === 'string' ? tag.trim().toLowerCase() : '';
    const cacheKey = `products:list:${categoryKey}:${searchKey}:${tagKey}`;

    // 1. Try Redis cache
    const cached = await cacheGet<{ products: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    // 2. Query MongoDB
    try {
      if (isDbConnected()) {
        let query: any = {};
        const conditions: any[] = [];

        if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
          const catRegex = new RegExp(`^${category}$`, 'i');
          conditions.push({
            $or: [{ category: catRegex }, { seriesLabel: new RegExp(category, 'i') }],
          });
        }

        if (search && typeof search === 'string' && search.trim() !== '') {
          const sRegex = new RegExp(search.trim(), 'i');
          conditions.push({
            $or: [
              { displayName: sRegex },
              { title: sRegex },
              { tagline: sRegex },
              { tags: sRegex },
              { seriesLabel: sRegex },
              { description: sRegex },
              { subtitle: sRegex },
            ],
          });
        }

        if (tag && typeof tag === 'string' && tag.trim() !== '' && tag.toLowerCase() !== 'all') {
          conditions.push({ tags: new RegExp(`^${tag.trim()}$`, 'i') });
        }

        if (conditions.length === 1) {
          query = conditions[0];
        } else if (conditions.length > 1) {
          query = { $and: conditions };
        }

        const products = await Product.find(query).sort({ priority: -1, createdAt: 1 });
        const responseData = { products, total: products.length };
        await cacheSet(cacheKey, responseData, 300);
        return responseData;
      }
    } catch (err: any) {
      logger.error('MongoDB product query error in repository:', err.message);
    }

    // 3. Fallback to in-memory templates
    let filtered = templates;
    if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (t) =>
          t.category.toLowerCase() === category.toLowerCase() ||
          t.seriesLabel.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.displayName && t.displayName.toLowerCase().includes(s)) ||
          (t.title && t.title.toLowerCase().includes(s)) ||
          (t.tagline && t.tagline.toLowerCase().includes(s)) ||
          (t.seriesLabel && t.seriesLabel.toLowerCase().includes(s)) ||
          (t.tags && t.tags.some((tg) => tg.toLowerCase().includes(s)))
      );
    }
    if (tag && typeof tag === 'string' && tag.trim() !== '' && tag.toLowerCase() !== 'all') {
      const targetTag = tag.trim().toLowerCase();
      filtered = filtered.filter((t) => t.tags && t.tags.some((tg) => tg.toLowerCase() === targetTag));
    }

    filtered.sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
    const responseData = { products: filtered, total: filtered.length };
    await cacheSet(cacheKey, responseData, 300);
    return responseData;
  }

  public static async findBySlugOrId(slugParam: string) {
    const cleanSlug = slugParam.toLowerCase().replace(/_/g, '-');
    const bareSlug = cleanSlug.replace(/-[0-9]+$/, '');
    const cacheKey = `product:item:${cleanSlug}`;

    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    try {
      if (isDbConnected()) {
        let query: any = {
          $or: [
            { slug: slugParam },
            { slug: cleanSlug },
            { slug: new RegExp(`^${slugParam}$`, 'i') },
            { slug: new RegExp(bareSlug, 'i') },
            { displayName: new RegExp(bareSlug.replace(/-/g, ' '), 'i') },
          ],
        };
        if (mongoose.isValidObjectId(slugParam)) {
          query.$or.push({ _id: slugParam });
        }
        const product = await Product.findOne(query);
        if (product) {
          await cacheSet(cacheKey, product, 300);
          return product;
        }
      }
    } catch (err: any) {
      logger.error('MongoDB single product query error:', err.message);
    }

    // In-memory fallback
    let product = templates.find(
      (t) =>
        t.slug === slugParam ||
        t.slug === cleanSlug ||
        t.id === slugParam ||
        t.slug.toLowerCase() === cleanSlug
    );

    if (!product) {
      product = templates.find(
        (t) =>
          t.slug.includes(bareSlug) ||
          bareSlug.includes(t.slug) ||
          (t.displayName && t.displayName.toLowerCase().includes(bareSlug.replace(/-/g, ' ')))
      );
    }

    if (product) {
      await cacheSet(cacheKey, product, 300);
    }
    return product || null;
  }

  public static async findFeatured() {
    const cacheKey = 'products:featured';
    const cached = await cacheGet<{ products: any[] }>(cacheKey);
    if (cached) return cached;

    try {
      if (isDbConnected()) {
        const featured = await Product.find({ featured: true }).sort({ priority: -1, createdAt: 1 });
        const res = { products: featured };
        await cacheSet(cacheKey, res, 300);
        return res;
      }
    } catch (err: any) {
      logger.error('Featured query error:', err.message);
    }

    const featured = templates.filter((t) => t.featured).sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
    const res = { products: featured };
    await cacheSet(cacheKey, res, 300);
    return res;
  }

  public static getCategories() {
    return { categories };
  }

  public static async getConfig() {
    const livePageOptions = await PageOptionRepository.findAll(true);
    return {
      sizes: productSizes,
      covers: coverTypes,
      themes: bookThemes,
      colors: bookColors,
      packaging: packagingOptions,
      pageCountOptions: livePageOptions && livePageOptions.length > 0 ? livePageOptions : pageCountOptions,
    };
  }

  public static async create(productData: any) {
    await cacheDelByPrefix('products:');
    await cacheDelByPrefix('product:');

    if (isDbConnected()) {
      return Product.create(productData);
    }

    const inMem: TemplateProduct = {
      ...productData,
      id: `tpl-${Date.now()}`,
    };
    templates.unshift(inMem);
    return inMem;
  }

  public static async update(idParam: string, updateData: any) {
    await cacheDelByPrefix('products:');
    await cacheDelByPrefix('product:');

    if (isDbConnected()) {
      let filter: any = { slug: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ _id: idParam }, { slug: idParam }] };
      }
      return Product.findOneAndUpdate(filter, updateData, { new: true });
    }

    const index = templates.findIndex((t) => t.id === idParam || t.slug === idParam);
    if (index === -1) return null;
    const updated = { ...templates[index]!, ...updateData };
    templates[index] = updated;
    return updated;
  }

  public static async delete(idParam: string) {
    await cacheDelByPrefix('products:');
    await cacheDelByPrefix('product:');

    if (isDbConnected()) {
      let filter: any = { slug: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ _id: idParam }, { slug: idParam }] };
      }
      return Product.findOneAndDelete(filter);
    }

    const index = templates.findIndex((t) => t.id === idParam || t.slug === idParam);
    if (index === -1) return null;
    const deleted = templates.splice(index, 1);
    return deleted[0];
  }
}

export default ProductRepository;
