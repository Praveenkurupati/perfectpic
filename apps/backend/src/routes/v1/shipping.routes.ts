// apps/backend/src/routes/v1/shipping.routes.ts
import { Router } from 'express';
import { ShippingController } from '../../controllers/ShippingController';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// POST /api/v1/shipping/calculate
router.post('/calculate', optionalAuth, ShippingController.calculate);

// POST /api/v1/shipping/pincode-lookup & /api/v1/shipping/pincode
router.post('/pincode-lookup', ShippingController.pincodeLookup);
router.post('/pincode', ShippingController.pincodeLookup);

// POST /api/v1/shipping/create-label
router.post('/create-label', authenticate, ShippingController.createLabel);

// GET /api/v1/shipping/track/:trackingId
router.get('/track/:trackingId', optionalAuth, ShippingController.track);

export default router;
