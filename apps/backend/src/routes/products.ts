import { Router } from 'express';
import {
  templates,
  categories,
  productSizes,
  coverTypes,
  bookThemes,
  bookColors,
  packagingOptions
} from '../data/templates';

const router = Router();

router.get('/', (req, res) => {
  const { category } = req.query;
  let filteredProducts = templates;
  
  if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
    filteredProducts = templates.filter(
      t => t.category.toLowerCase() === category.toLowerCase()
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
  const product = templates.find(t => t.slug === req.params.slug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

export default router;
