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
  TemplateProduct
} from '../data/templates';
import { Product } from '../db/models/Product';
import { isDbConnected } from '../db/connection';

const router = Router();

// GET /api/products - list all products with optional ?category=Travel filter
router.get('/', async (req, res) => {
  const { category } = req.query;

  try {
    if (isDbConnected()) {
      let query: any = {};
      if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
        const catRegex = new RegExp(`^${category}$`, 'i');
        query = {
          $or: [
            { category: catRegex },
            { seriesLabel: new RegExp(category, 'i') }
          ]
        };
      }
      const products = await Product.find(query).sort({ createdAt: -1 });
      return res.json({ products, total: products.length });
    }
  } catch (err) {
    console.error('MongoDB product query error:', err);
  }

  // Fallback to in-memory templates
  let filteredProducts = templates;
  if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
    filteredProducts = templates.filter(
      t => t.category.toLowerCase() === category.toLowerCase() ||
           t.seriesLabel.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  res.json({ products: filteredProducts, total: filteredProducts.length });
});

router.get('/categories', (req, res) => {
  res.json({ categories });
});

router.get('/config', (req, res) => {
  res.json({
    sizes: productSizes,
    covers: coverTypes,
    themes: bookThemes,
    colors: bookColors,
    packaging: packagingOptions
  });
});

router.get('/featured', async (req, res) => {
  try {
    if (isDbConnected()) {
      const featured = await Product.find({ featured: true }).sort({ createdAt: -1 });
      return res.json({ products: featured });
    }
  } catch (err) {
    console.error('MongoDB featured query error:', err);
  }

  const featured = templates.filter(t => t.featured);
  res.json({ products: featured });
});

router.get('/:slug', async (req, res) => {
  const slugParam = req.params.slug;

  try {
    if (isDbConnected()) {
      let query: any = { slug: slugParam };
      if (mongoose.isValidObjectId(slugParam)) {
        query = { $or: [{ slug: slugParam }, { _id: slugParam }] };
      }
      const product = await Product.findOne(query);
      if (product) {
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

  try {
    if (isDbConnected()) {
      let filter: any = { slug: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        filter = { $or: [{ _id: idParam }, { slug: idParam }] };
      }

      const updateData = { ...req.body };
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
  const updated: TemplateProduct = {
    ...existing,
    ...req.body,
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
