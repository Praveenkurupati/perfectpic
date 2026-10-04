import { Router } from 'express';
import { TicketController } from '../../controllers/TicketController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// List support tickets with filter (?status=Open) - Admin only
router.get('/', authenticate, adminOnly, TicketController.getTickets);

// Single ticket by ID - Authenticated user or admin
router.get('/:id', authenticate, TicketController.getTicketById);

// Submit new support ticket - Public / Customer
router.post('/', TicketController.createTicket);

// Update ticket status (e.g. In Progress, Resolved) - Admin only
router.put('/:id/status', authenticate, adminOnly, TicketController.updateStatus);

export default router;
