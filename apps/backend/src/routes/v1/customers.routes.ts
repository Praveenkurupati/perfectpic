import { Router } from 'express';
import { CustomerController } from '../../controllers/CustomerController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// List customers with stats (ordersCount, totalSpent) - Admin only
router.get('/', authenticate, adminOnly, CustomerController.getCustomers);

export default router;
