// apps/backend/src/services/TicketService.ts
import { TicketRepository } from '../repositories/TicketRepository';
import { ApiError } from '../utils/apiError';

export class TicketService {
  public static async getTickets(statusFilter?: string) {
    return await TicketRepository.findAll(statusFilter);
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
    return await TicketRepository.create(data);
  }

  public static async updateTicketStatus(id: string, status: string) {
    const updated = await TicketRepository.updateStatus(id, status);
    if (!updated) {
      throw ApiError.notFound(`Ticket with ID '${id}' not found.`);
    }
    return updated;
  }
}

export default TicketService;
