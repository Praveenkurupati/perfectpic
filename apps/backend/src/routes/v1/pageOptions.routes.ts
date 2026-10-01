// apps/backend/src/routes/v1/pageOptions.routes.ts
import { Router } from 'express';
import { PageOptionController } from '../../controllers/PageOptionController';

const router = Router();

// Public: Get active page options for storefront & configure page
router.get('/', PageOptionController.getActivePageOptions);

// Admin: Get all page options (active + inactive)
router.get('/all', PageOptionController.getAllPageOptions);

// Admin: Reset to default page tiers
router.post('/reset', PageOptionController.resetDefaults);

// Single page option by id/count
router.get('/:id', PageOptionController.getPageOptionById);

// Admin: Create new page option
router.post('/', PageOptionController.createPageOption);

// Admin: Update page option
router.put('/:id', PageOptionController.updatePageOption);

// Admin: Delete page option
router.delete('/:id', PageOptionController.deletePageOption);

export default router;
