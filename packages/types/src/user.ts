import { z } from "zod";

// ─── User & Auth Types ──────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  authProvider: z.enum(["otp", "google", "apple"]).default("otp"),
  role: z.enum(["customer", "admin", "super-admin"]).default("customer"),
  isVerified: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const AddressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  alternatePhone: z.string().optional(),
  pinCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  city: z.string(),
  state: z.string(),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  type: z.enum(["home", "work", "other"]).default("home"),
  isDefault: z.boolean().default(false),
});
export type Address = z.infer<typeof AddressSchema>;

// ─── OTP Auth Schemas ───────────────────────────────────────────────────────

export const SendOtpSchema = z.object({
  identifier: z.string().min(1), // phone or email
  type: z.enum(["sms", "whatsapp", "email"]).default("sms"),
});
export type SendOtpInput = z.infer<typeof SendOtpSchema>;

export const VerifyOtpSchema = z.object({
  identifier: z.string().min(1),
  otp: z.string().length(6),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

// ─── Support Ticket ─────────────────────────────────────────────────────────

export const TicketStatusEnum = z.enum(["open", "in-progress", "resolved", "closed"]);
export type TicketStatus = z.infer<typeof TicketStatusEnum>;

export const TicketTypeEnum = z.enum([
  "cancellation",
  "address-change",
  "damage-report",
  "reprint-request",
  "general-inquiry",
]);
export type TicketType = z.infer<typeof TicketTypeEnum>;

export const SupportTicketSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  type: TicketTypeEnum,
  status: TicketStatusEnum.default("open"),
  subject: z.string().min(5),
  description: z.string().min(10),
  attachments: z.array(z.string().url()).optional(),
  response: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;
