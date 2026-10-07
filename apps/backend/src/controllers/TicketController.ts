// apps/backend/src/controllers/TicketController.ts
import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/TicketService';

export class TicketController {
  public static async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await TicketService.getTickets(status, page, limit);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const ticket = await TicketService.getTicketById(id);
      return res.status(200).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  public static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.createTicket(req.body);
      return res.status(201).json({
        message: 'Support ticket submitted successfully',
        ticket,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const ticket = await TicketService.updateTicketStatus(id, status);
      return res.status(200).json({
        message: 'Ticket status updated',
        ticket,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default TicketController;
