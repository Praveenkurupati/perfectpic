import { Router } from 'express';
import { BundleController } from '../../controllers/BundleController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// Public: Get active bundle tiers for storefront and cart
router.get('/', BundleController.getActiveBundles);

// Admin: Get all bundle tiers (active + inactive)
router.get('/all', authenticate, adminOnly, BundleController.getAllBundles);

// Admin: Reset to default bundle tiers
router.post('/reset', authenticate, adminOnly, BundleController.resetDefaults);

// Single bundle tier by id/minQuantity
router.get('/:id', BundleController.getBundleById);

// Admin: Create new bundle tier
router.post('/', authenticate, adminOnly, BundleController.createBundle);

// Admin: Update bundle tier
router.put('/:id', authenticate, adminOnly, BundleController.updateBundle);

// Admin: Delete bundle tier
router.delete('/:id', authenticate, adminOnly, BundleController.deleteBundle);

export default router;
