import { Router } from 'express';
import { ProductController } from '../../controllers/ProductController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// Catalog listing with filters (?category=, ?search=, ?tag=)
router.get('/', ProductController.getProducts);

// Categories metadata
router.get('/categories', ProductController.getCategories);

// Customization configuration (sizes, covers, themes, colors, packagings)
router.get('/config', ProductController.getConfig);

// Featured photobooks
router.get('/featured', ProductController.getFeatured);

// Single photobook by slug or ID (with fuzzy resolution e.g. Paris_1)
router.get('/:slug', ProductController.getProductBySlug);

// Admin: Add new template book
router.post('/', authenticate, adminOnly, ProductController.createProduct);

// Admin: Update existing template book
router.put('/:id', authenticate, adminOnly, ProductController.updateProduct);

// Admin: Delete template book
router.delete('/:id', authenticate, adminOnly, ProductController.deleteProduct);

export default router;
