// apps/backend/src/routes/v1/bundles.routes.ts
import { Router } from 'express';
import { BundleController } from '../../controllers/BundleController';

const router = Router();

// Public: Get active bundle tiers for storefront and cart
router.get('/', BundleController.getActiveBundles);

// Admin: Get all bundle tiers (active + inactive)
router.get('/all', BundleController.getAllBundles);

// Admin: Reset to default bundle tiers (3 Books: ₹300, 6 Books: ₹1800, 12 Books: ₹4500)
router.post('/reset', BundleController.resetDefaults);

// Single bundle tier by id/minQuantity
router.get('/:id', BundleController.getBundleById);

// Admin: Create new bundle tier
router.post('/', BundleController.createBundle);

// Admin: Update bundle tier
router.put('/:id', BundleController.updateBundle);

// Admin: Delete bundle tier
router.delete('/:id', BundleController.deleteBundle);

export default router;
