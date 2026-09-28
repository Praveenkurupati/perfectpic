// apps/backend/src/models/Ticket.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITicket extends Document {
  id?: string;
  ticketNumber: string;
  type: 'Address Change' | 'Damage Report' | 'Reprint Request' | 'Cancellation' | 'General Query' | string;
  subject: string;
  customerName: string;
  customerEmail: string;
  orderNumber?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  messages: Array<{
    sender: 'customer' | 'support' | 'system';
    text: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema<ITicket> = new Schema<ITicket>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, default: 'General Query', index: true },
    subject: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, index: true },
    orderNumber: { type: String, index: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open', index: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    messages: [
      {
        sender: { type: String, enum: ['customer', 'support', 'system'], default: 'customer' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Ticket: Model<ITicket> =
  (mongoose.models.Ticket as Model<ITicket>) || mongoose.model<ITicket>('Ticket', TicketSchema);
