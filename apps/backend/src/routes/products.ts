import { Router } from 'express';
import mongoose from 'mongoose';
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
import { Product } from '../db/models/Product';
import { isDbConnected } from '../db/connection';
import { cacheGet, cacheSet, cacheDelByPrefix } from '../cache/redis';

const router = Router();

// GET /api/products - list all products with optional ?category=, ?search=, ?tag= filters
router.get('/', async (req, res) => {
  const { category, search, tag } = req.query;
  const categoryKey = category && typeof category === 'string' ? category.toLowerCase() : 'all';
  const searchKey = search && typeof search === 'string' ? search.trim().toLowerCase() : '';
  const tagKey = tag && typeof tag === 'string' ? tag.trim().toLowerCase() : '';
  const cacheKey = `products:list:${categoryKey}:${searchKey}:${tagKey}`;

  // 1. Try Redis cache
  const cached = await cacheGet<{ products: any[]; total: number }>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // 2. Query MongoDB
  try {
    if (isDbConnected()) {
      let query: any = {};
      const conditions: any[] = [];

      if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
        const catRegex = new RegExp(`^${category}$`, 'i');
        conditions.push({
          $or: [
            { category: catRegex },
            { seriesLabel: new RegExp(category, 'i') }
          ]
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
            { subtitle: sRegex }
          ]
        });
      }

      if (tag && typeof tag === 'string' && tag.trim() !== '' && tag.toLowerCase() !== 'all') {
        conditions.push({
          tags: new RegExp(`^${tag.trim()}$`, 'i')
        });
      }

      if (conditions.length === 1) {
        query = conditions[0];
      } else if (conditions.length > 1) {
        query = { $and: conditions };
      }

      const products = await Product.find(query).sort({ priority: -1, createdAt: 1 });
      const responseData = { products, total: products.length };
      await cacheSet(cacheKey, responseData, 300); // 5 min TTL
      return res.json(responseData);
    }
  } catch (err) {
    console.error('MongoDB product query error:', err);
  }

  // 3. Fallback to in-memory templates
  let filteredProducts = templates;
  if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
    filteredProducts = filteredProducts.filter(
      t => t.category.toLowerCase() === category.toLowerCase() ||
           t.seriesLabel.toLowerCase().includes(category.toLowerCase())
    );
  }
  if (search && typeof search === 'string' && search.trim() !== '') {
    const s = search.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(
      t => (t.displayName && t.displayName.toLowerCase().includes(s)) ||
           (t.title && t.title.toLowerCase().includes(s)) ||
           (t.tagline && t.tagline.toLowerCase().includes(s)) ||
           (t.seriesLabel && t.seriesLabel.toLowerCase().includes(s)) ||
           (t.tags && t.tags.some(tg => tg.toLowerCase().includes(s)))
    );
  }
  if (tag && typeof tag === 'string' && tag.trim() !== '' && tag.toLowerCase() !== 'all') {
    const targetTag = tag.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(
      t => t.tags && t.tags.some(tg => tg.toLowerCase() === targetTag)
    );
  }
  
  filteredProducts.sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
  const responseData = { products: filteredProducts, total: filteredProducts.length };
  await cacheSet(cacheKey, responseData, 300);
  res.json(responseData);
});

router.get('/categories', async (req, res) => {
  const cacheKey = 'products:categories';
  const cached = await cacheGet<{ categories: any[] }>(cacheKey);
  if (cached) return res.json(cached);

  const responseData = { categories };
  await cacheSet(cacheKey, responseData, 3600);
  res.json(responseData);
});

router.get('/config', async (req, res) => {
  const cacheKey = 'products:config';
  const cached = await cacheGet<any>(cacheKey);
  if (cached) return res.json(cached);

  const responseData = {
    sizes: productSizes,
    covers: coverTypes,
    themes: bookThemes,
    colors: bookColors,
    packaging: packagingOptions,
    pageCountOptions: pageCountOptions
  };
  await cacheSet(cacheKey, responseData, 3600);
  res.json(responseData);
});

router.get('/featured', async (req, res) => {
  const cacheKey = 'products:featured';
  const cached = await cacheGet<{ products: any[] }>(cacheKey);
  if (cached) return res.json(cached);

  try {
    if (isDbConnected()) {
      const featured = await Product.find({ featured: true }).sort({ priority: -1, createdAt: 1 });
      const responseData = { products: featured };
      await cacheSet(cacheKey, responseData, 300);
      return res.json(responseData);
    }
  } catch (err) {
    console.error('MongoDB featured query error:', err);
  }

  const featured = templates.filter(t => t.featured).sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));
  const responseData = { products: featured };
  await cacheSet(cacheKey, responseData, 300);
  res.json(responseData);
});

router.get('/:slug', async (req, res) => {
  const slugParam = req.params.slug;
  const cacheKey = `product:item:${slugParam}`;

  const cached = await cacheGet<any>(cacheKey);
  if (cached) return res.json(cached);

  try {
    if (isDbConnected()) {
      let query: any = { slug: slugParam };
      if (mongoose.isValidObjectId(slugParam)) {
        query = { $or: [{ slug: slugParam }, { _id: slugParam }] };
      }
      const product = await Product.findOne(query);
      if (product) {
        await cacheSet(cacheKey, product, 300);
        return res.json(product);
      }
    }
  } catch (err) {
    console.error('MongoDB single product query error:', err);
  }

  const product = templates.find(t => t.slug === slugParam || t.id === slugParam);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  await cacheSet(cacheKey, product, 300);
  res.json(product);
});

// Admin: Add new template book
router.post('/', async (req, res) => {
  const body = req.body;
  if (!body.displayName && !body.title) {
    return res.status(400).json({ error: 'Book title is required' });
  }

  const slug = (body.displayName || body.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Math.floor(100 + Math.random() * 900);

  const productData = {
    slug: body.slug || slug,
    seriesLabel: body.seriesLabel || 'travel series',
    bookType: body.bookType || 'custom photobook',
    title: body.title || body.displayName || 'custom photobook',
    displayName: body.displayName || body.title || 'New Photobook',
    tagline: body.tagline || 'your journeys, perfectly told',
    subtitle: body.subtitle || '',
    description: body.description || '',
    category: body.category || 'Travel',
    coverImage: body.coverImage || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
    coverColor: body.coverColor || '#F8BAC7',
    spineText: body.spineText || 'PHOTOBOOK',
    rating: Number(body.rating) || 5.0,
    reviewCount: Number(body.reviewCount) || 72,
    fromPrice: Number(body.fromPrice) || 1999,
    pricing: body.pricing || { '8.25': Number(body.fromPrice) || 1999, '10': (Number(body.fromPrice) || 1999) + 500 },
    basePages: Number(body.basePages) || 40,
    maxPhotos: Number(body.maxPhotos) || 100,
    badge: body.badge || '',
    featured: body.featured ?? true,
    tags: Array.isArray(body.tags)
      ? body.tags
      : (typeof body.tags === 'string'
          ? body.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
          : []),
    pageOptions: Array.isArray(body.pageOptions) && body.pageOptions.length > 0
      ? body.pageOptions
      : [12, 24, 32, 60, 120],
    defaultOptions: body.defaultOptions || {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-4',
      color: 'col-1',
      packaging: 'pack-1'
    },
    templatePhotos: body.templatePhotos && body.templatePhotos.length > 0
      ? body.templatePhotos
      : [body.coverImage || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop']
  };

  // Invalidate Redis caches
  await cacheDelByPrefix('products:');
  await cacheDelByPrefix('product:');

  try {
    if (isDbConnected()) {
      const created = await Product.create(productData);
      return res.status(201).json({ message: 'Template created successfully', product: created });
    }
  } catch (err: any) {
    console.error('MongoDB create product error:', err);
  }

  // Fallback in-memory
  const inMem: TemplateProduct = {
    ...productData,
    id: `tpl-${Date.now()}`
  };
  templates.unshift(inMem);
  res.status(201).json({ message: 'Template created successfully', product: inMem });
});

// Admin: Update existing template book
router.put('/:id', async (req, res) => {
  const idParam = req.params.id;

  // Invalidate Redis caches
  await cacheDelByPrefix('products:');
  await cacheDelByPrefix('product:');

  try {
    if (isDbConnected()) {
      let filter: any = { slug: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ _id: idParam }, { slug: idParam }] };
      }

      const updateData = { ...req.body };
      if (typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      }
      if (updateData.pageOptions && typeof updateData.pageOptions === 'string') {
        updateData.pageOptions = updateData.pageOptions.split(',').map((p: string) => Number(p.trim())).filter((n: number) => !isNaN(n));
      }
      if (updateData.fromPrice) {
        updateData.fromPrice = Number(updateData.fromPrice);
        if (!updateData.pricing) {
          updateData.pricing = { '8.25': updateData.fromPrice, '10': updateData.fromPrice + 500 };
        }
      }
      if (updateData.basePages) updateData.basePages = Number(updateData.basePages);

      const updated = await Product.findOneAndUpdate(filter, updateData, { new: true });
      if (updated) {
        return res.json({ message: 'Template updated successfully', product: updated });
      }
    }
  } catch (err) {
    console.error('MongoDB update product error:', err);
  }

  // Fallback in-memory
  const index = templates.findIndex(t => t.id === idParam || t.slug === idParam);
  if (index === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const existing = templates[index]!;
  const parsedTags = req.body.tags !== undefined
    ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean))
    : existing.tags;
  const parsedPageOptions = req.body.pageOptions !== undefined
    ? (Array.isArray(req.body.pageOptions) ? req.body.pageOptions : req.body.pageOptions.split(',').map((p: string) => Number(p.trim())).filter((n: number) => !isNaN(n)))
    : existing.pageOptions;

  const updated: TemplateProduct = {
    ...existing,
    ...req.body,
    tags: parsedTags,
    pageOptions: parsedPageOptions,
    fromPrice: req.body.fromPrice ? Number(req.body.fromPrice) : existing.fromPrice,
    basePages: req.body.basePages ? Number(req.body.basePages) : existing.basePages,
    pricing: req.body.fromPrice 
      ? { '8.25': Number(req.body.fromPrice), '10': Number(req.body.fromPrice) + 500 }
      : existing.pricing
  };

  templates[index] = updated;
  res.json({ message: 'Template updated successfully', product: updated });
});

// Admin: Delete template book
router.delete('/:id', async (req, res) => {
  const idParam = req.params.id;

  // Invalidate Redis caches
  await cacheDelByPrefix('products:');
  await cacheDelByPrefix('product:');

  try {
    if (isDbConnected()) {
      let filter: any = { slug: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ _id: idParam }, { slug: idParam }] };
      }
      const deleted = await Product.findOneAndDelete(filter);
      if (deleted) {
        return res.json({ message: 'Template deleted successfully' });
      }
    }
  } catch (err) {
    console.error('MongoDB delete product error:', err);
  }

  const index = templates.findIndex(t => t.id === idParam || t.slug === idParam);
  if (index === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }

  templates.splice(index, 1);
  res.json({ message: 'Template deleted successfully' });
});

export default router;
