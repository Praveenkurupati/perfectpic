import { Router } from 'express';
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

const router = Router();

router.get('/', (req, res) => {
  const { category } = req.query;
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

router.get('/featured', (req, res) => {
  const featured = templates.filter(t => t.featured);
  res.json({ products: featured });
});

router.get('/:slug', (req, res) => {
  const product = templates.find(t => t.slug === req.params.slug || t.id === req.params.slug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Admin: Add new template book
router.post('/', (req, res) => {
  const body = req.body;
  if (!body.displayName && !body.title) {
    return res.status(400).json({ error: 'Book title is required' });
  }

  const slug = (body.displayName || body.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newTemplate: TemplateProduct = {
    id: `tpl-${Date.now()}`,
    slug: slug || `tpl-${Date.now()}`,
    seriesLabel: body.seriesLabel || 'travel series',
    bookType: body.bookType || 'custom photobook',
    title: body.title || 'custom photobook',
    displayName: body.displayName || body.title || 'New Photobook',
    tagline: body.tagline || 'your journeys, perfectly told',
    subtitle: body.subtitle || '',
    description: body.description || '',
    category: body.category || 'Travel',
    coverImage: body.coverImage || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
    coverColor: body.coverColor || '#F8BAC7',
    spineText: body.spineText || 'PHOTOBOOK',
    rating: body.rating || 5.0,
    reviewCount: body.reviewCount || 72,
    fromPrice: Number(body.fromPrice) || 1999,
    pricing: body.pricing || { '8.25': Number(body.fromPrice) || 1999, '10': (Number(body.fromPrice) || 1999) + 500 },
    basePages: Number(body.basePages) || 40,
    maxPhotos: Number(body.maxPhotos) || 100,
    badge: body.badge || '',
    featured: body.featured ?? true,
    defaultOptions: body.defaultOptions || {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-1',
      color: 'col-1',
      packaging: 'pack-1'
    },
    templatePhotos: body.templatePhotos || [body.coverImage]
  };

  templates.unshift(newTemplate);
  res.status(201).json({ message: 'Template created successfully', product: newTemplate });
});

// Admin: Update existing template book
router.put('/:id', (req, res) => {
  const index = templates.findIndex(t => t.id === req.params.id || t.slug === req.params.id);
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
router.delete('/:id', (req, res) => {
  const index = templates.findIndex(t => t.id === req.params.id || t.slug === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Template not found' });
  }

  templates.splice(index, 1);
  res.json({ message: 'Template deleted successfully' });
});

export default router;
