// apps/backend/src/routes/v1/pricing.routes.ts
import { Router } from 'express';
import { PricingController } from '../../controllers/PricingController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// POST /api/v1/pricing/calculate - Authoritative server-side price calculation
router.post('/calculate', optionalAuth, PricingController.calculate);

// POST /api/v1/pricing/verify - Verify and check for price tampering
router.post('/verify', optionalAuth, PricingController.verify);

export default router;
