// apps/backend/src/repositories/TicketRepository.ts
import mongoose from 'mongoose';
import { Ticket, ITicket } from '../models/Ticket';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

const mockTickets = [
  {
    id: "TCK-1042",
    ticketNumber: "TCK-1042",
    type: "Address Change",
    subject: "Update delivery address before dispatch",
    customerName: "Priya Sharma",
    customerEmail: "priya@example.com",
    orderNumber: "PP-8491",
    status: "Open",
    priority: "High",
    createdAt: new Date("2026-09-26T10:00:00.000Z"),
  },
  {
    id: "TCK-1041",
    ticketNumber: "TCK-1041",
    type: "Damage Report",
    subject: "Corner dent on courier package",
    customerName: "Rahul Verma",
    customerEmail: "rahul@example.com",
    orderNumber: "PP-7201",
    status: "In Progress",
    priority: "Urgent",
    createdAt: new Date("2026-09-24T15:30:00.000Z"),
  },
  {
    id: "TCK-1040",
    ticketNumber: "TCK-1040",
    type: "Reprint Request",
    subject: "Free reprint request under 30-day guarantee",
    customerName: "Ananya Rao",
    customerEmail: "ananya@example.com",
    orderNumber: "PP-6350",
    status: "Resolved",
    priority: "Medium",
    createdAt: new Date("2026-09-20T11:45:00.000Z"),
  },
  {
    id: "TCK-1039",
    ticketNumber: "TCK-1039",
    type: "Cancellation",
    subject: "Order cancelled duplicate placed",
    customerName: "Vikram Malhotra",
    customerEmail: "vikram@example.com",
    orderNumber: "PP-5120",
    status: "Closed",
    priority: "Low",
    createdAt: new Date("2026-09-18T09:20:00.000Z"),
  },
];

export class TicketRepository {
  public static async findAll(statusFilter?: string, page: number = 1, limit: number = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    try {
      if (isDbConnected()) {
        const query: any = {};
        if (statusFilter && statusFilter.toLowerCase() !== 'all') {
          query.status = new RegExp(`^${statusFilter}$`, 'i');
        }
        const tickets = await Ticket.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit);
        const total = await Ticket.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(total / safeLimit));
        return { tickets, total, page: safePage, totalPages, limit: safeLimit };
      }
    } catch (err: any) {
      logger.error('TicketRepository findAll error:', err.message);
    }

    let filtered = [...mockTickets];
    if (statusFilter && statusFilter.toLowerCase() !== 'all') {
      filtered = filtered.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase());
    }
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const paged = filtered.slice(skip, skip + safeLimit);
    return { tickets: paged, total, page: safePage, totalPages, limit: safeLimit };
  }

  public static async findById(idParam: string) {
    if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
      return await Ticket.findById(idParam);
    }
    return mockTickets.find((t) => t.id === idParam || t.ticketNumber === idParam) || null;
  }

  public static async create(ticketData: any) {
    const ticketNumber = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
    const payload = {
      ticketNumber,
      status: 'Open',
      priority: 'Medium',
      ...ticketData,
    };

    if (isDbConnected()) {
      return await Ticket.create(payload);
    }

    const inMem = { id: ticketNumber, _id: ticketNumber, ...payload, createdAt: new Date() };
    mockTickets.unshift(inMem as any);
    return inMem;
  }

  public static async updateStatus(idParam: string, status: string) {
    if (isDbConnected()) {
      let query: any = { ticketNumber: idParam };
      if (mongoose.isValidObjectId(idParam)) {
        query = { $or: [{ _id: idParam }, { ticketNumber: idParam }] };
      }
      return await Ticket.findOneAndUpdate(query, { status }, { new: true });
    }

    const index = mockTickets.findIndex((t) => t.id === idParam || t.ticketNumber === idParam);
    if (index !== -1) {
      mockTickets[index]!.status = status as any;
      return mockTickets[index];
    }
    return null;
  }
}

export default TicketRepository;
