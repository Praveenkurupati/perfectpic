// apps/backend/src/routes/v1/customers.routes.ts
import { Router } from 'express';
import { CustomerController } from '../../controllers/CustomerController';

const router = Router();

// List customers with stats (ordersCount, totalSpent)
router.get('/', CustomerController.getCustomers);

export default router;
