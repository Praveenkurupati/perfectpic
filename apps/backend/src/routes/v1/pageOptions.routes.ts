import { Router } from 'express';
import { PageOptionController } from '../../controllers/PageOptionController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// Public: Get active page options for storefront & configure page
router.get('/', PageOptionController.getActivePageOptions);

// Admin: Get all page options (active + inactive)
router.get('/all', authenticate, adminOnly, PageOptionController.getAllPageOptions);

// Admin: Reset to default page tiers
router.post('/reset', authenticate, adminOnly, PageOptionController.resetDefaults);

// Single page option by id/count
router.get('/:id', PageOptionController.getPageOptionById);

// Admin: Create new page option
router.post('/', authenticate, adminOnly, PageOptionController.createPageOption);

// Admin: Update page option
router.put('/:id', authenticate, adminOnly, PageOptionController.updatePageOption);

// Admin: Delete page option
router.delete('/:id', authenticate, adminOnly, PageOptionController.deletePageOption);

export default router;
