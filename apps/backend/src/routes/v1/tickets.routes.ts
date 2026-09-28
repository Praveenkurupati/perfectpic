// apps/backend/src/routes/v1/tickets.routes.ts
import { Router } from 'express';
import { TicketController } from '../../controllers/TicketController';

const router = Router();

// List support tickets with filter (?status=Open)
router.get('/', TicketController.getTickets);

// Single ticket by ID
router.get('/:id', TicketController.getTicketById);

// Submit new support ticket
router.post('/', TicketController.createTicket);

// Update ticket status (e.g. In Progress, Resolved)
router.put('/:id/status', TicketController.updateStatus);

export default router;
