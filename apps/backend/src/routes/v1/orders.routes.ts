// apps/backend/src/routes/v1/orders.routes.ts
import { Router } from 'express';
import { OrderController } from '../../controllers/OrderController';

const router = Router();

// List orders (public / authenticated)
router.get('/', OrderController.getOrders);

// Dashboard aggregate metrics for admin
router.get('/stats', OrderController.getDashboardStats);

// Single order by ID or order number
router.get('/:id', OrderController.getOrderById);

// Create new customer order
router.post('/', OrderController.createOrder);

// Admin: Update order fulfillment status
router.put('/:id/status', OrderController.updateOrderStatus);

export default router;
