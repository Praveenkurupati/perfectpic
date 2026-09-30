// apps/backend/src/routes/v1/promos.routes.ts
import { Router } from 'express';
import { PromoCodeController } from '../../controllers/PromoCodeController';
import { authenticate, adminOnly, optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Customer / Storefront endpoints
router.post('/validate', optionalAuth, PromoCodeController.validate);
router.get('/active', PromoCodeController.getActiveOffers);

// Admin management endpoints (protected)
router.get('/', authenticate, adminOnly, PromoCodeController.getAll);
router.post('/', authenticate, adminOnly, PromoCodeController.create);
router.get('/:id', authenticate, adminOnly, PromoCodeController.getById);
router.put('/:id', authenticate, adminOnly, PromoCodeController.update);
router.delete('/:id', authenticate, adminOnly, PromoCodeController.delete);
router.patch('/:id/toggle', authenticate, adminOnly, PromoCodeController.toggleStatus);
router.get('/:id/usages', authenticate, adminOnly, PromoCodeController.getUsages);

export default router;
