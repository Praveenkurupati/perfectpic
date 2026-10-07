import { Router } from 'express';
import { OrderController } from '../../controllers/OrderController';
import { optionalAuth, authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// List orders (authenticated customer filter or admin overview)
router.get('/', optionalAuth, OrderController.getOrders);

// Dashboard aggregate metrics for admin
router.get('/stats', authenticate, adminOnly, OrderController.getDashboardStats);

// Single order by ID or order number (requires ownership or admin authentication)
router.get('/:id', optionalAuth, OrderController.getOrderById);

// Download order PDF invoice/summary (requires ownership or admin authentication)
router.get('/:id/pdf', optionalAuth, OrderController.downloadOrderPdf);

// Order Review & Rating endpoints
router.get('/:id/review', OrderController.getOrderReview);
router.post('/:id/review', OrderController.submitOrderReview);

// Create new customer order
router.post('/', OrderController.createOrder);

// Admin: Update order fulfillment status
router.put('/:id/status', authenticate, adminOnly, OrderController.updateOrderStatus);

// Admin: Amend order delivery address (OPS-01)
router.put('/:id/address', authenticate, adminOnly, OrderController.updateOrderAddress);

// Admin / System: Update order PDF URL (e.g., when S3 PDF is generated)
router.put('/:id/pdf', authenticate, adminOnly, OrderController.updateOrderPdf);

export default router;
