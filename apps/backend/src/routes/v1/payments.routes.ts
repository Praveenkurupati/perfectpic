import { Router } from 'express';
import { PaymentController } from '../../controllers/PaymentController';
import { optionalAuth } from '../../middlewares/auth.middleware';
import { orderRateLimiter } from '../../middlewares/rateLimiter';

const router = Router();

router.post('/create-order', orderRateLimiter, optionalAuth, PaymentController.createOrder);
router.post('/verify', orderRateLimiter, optionalAuth, PaymentController.verify);
router.post('/webhook', PaymentController.webhook);
router.post('/apply-promo', optionalAuth, PaymentController.applyPromo);

export default router;
