import { Router } from 'express';
import { OrderController } from '../../controllers/OrderController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// List orders (authenticated customer filter or admin overview)
router.get('/', optionalAuth, OrderController.getOrders);

// Dashboard aggregate metrics for admin
router.get('/stats', OrderController.getDashboardStats);

// Single order by ID or order number
router.get('/:id', OrderController.getOrderById);

// Download order PDF invoice/summary
router.get('/:id/pdf', OrderController.downloadOrderPdf);

// Order Review & Rating endpoints
router.get('/:id/review', OrderController.getOrderReview);
router.post('/:id/review', OrderController.submitOrderReview);

// Create new customer order
router.post('/', OrderController.createOrder);

// Admin: Update order fulfillment status
router.put('/:id/status', OrderController.updateOrderStatus);

// Update order PDF URL (e.g., when S3 PDF is generated)
router.put('/:id/pdf', OrderController.updateOrderPdf);

export default router;
