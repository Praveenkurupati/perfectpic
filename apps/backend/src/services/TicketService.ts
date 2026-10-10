// apps/backend/src/services/TicketService.ts
import { TicketRepository } from '../repositories/TicketRepository';
import { ApiError } from '../utils/apiError';

import { WhatsappService } from './WhatsappService';
import { logger } from '../utils/logger';

export class TicketService {
  public static async getTickets(statusFilter?: string, page: number = 1, limit: number = 10) {
    return await TicketRepository.findAll(statusFilter, page, limit);
  }

  public static async getTicketById(id: string) {
    const ticket = await TicketRepository.findById(id);
    if (!ticket) {
      throw ApiError.notFound(`Ticket with ID '${id}' not found.`);
    }
    return ticket;
  }

  public static async createTicket(data: any) {
    if (!data.subject || !data.customerEmail) {
      throw ApiError.badRequest('Subject and customer email are required.');
    }
    const ticket = await TicketRepository.create(data);

    if (data.customerPhone) {
      WhatsappService.sendSupportTicketUpdate(data.customerPhone, {
        ticketId: ticket.id || String(ticket._id),
        subject: data.subject,
        status: 'received',
        customerName: data.customerName,
      }).catch((err) => {
        logger.error('Failed to dispatch WhatsApp ticket creation notification:', err.message);
      });
    }

    return ticket;
  }

  public static async updateTicketStatus(id: string, status: string, messageSnippet?: string) {
    const updated = await TicketRepository.updateStatus(id, status);
    if (!updated) {
      throw ApiError.notFound(`Ticket with ID '${id}' not found.`);
    }

    if ((updated as any).customerPhone) {
      WhatsappService.sendSupportTicketUpdate((updated as any).customerPhone, {
        ticketId: String(updated.id || (updated as any)._id),
        subject: (updated as any).subject,
        status,
        customerName: (updated as any).customerName,
        messageSnippet,
      }).catch((err) => {
        logger.error('Failed to dispatch WhatsApp ticket update notification:', err.message);
      });
    }

    return updated;
  }
}

export default TicketService;
