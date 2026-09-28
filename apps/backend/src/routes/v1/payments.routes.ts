// apps/backend/src/routes/v1/payments.routes.ts
import { Router } from 'express';
import { PaymentController } from '../../controllers/PaymentController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/create-order', optionalAuth, PaymentController.createOrder);
router.post('/verify', optionalAuth, PaymentController.verify);
router.post('/webhook', PaymentController.webhook);
router.post('/apply-promo', optionalAuth, PaymentController.applyPromo);

export default router;
