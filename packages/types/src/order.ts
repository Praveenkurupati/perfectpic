import { z } from "zod";

// ─── Order Types ────────────────────────────────────────────────────────────

export const OrderStatusEnum = z.enum([
  "payment-pending",
  "confirmed",
  "generating-pdf",
  "printing",
  "quality-check",
  "dispatched",
  "delivered",
  "returned",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const PaymentMethodEnum = z.enum([
  "upi",
  "credit-card",
  "debit-card",
  "net-banking",
  "wallet",
  "partial-cod",
]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const PaymentStatusEnum = z.enum([
  "pending",
  "deposit-paid",
  "fully-paid",
  "refunded",
  "failed",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const DeliveryTypeEnum = z.enum(["standard", "express"]);
export type DeliveryType = z.infer<typeof DeliveryTypeEnum>;

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  projectId: z.string().uuid(),
  bookSize: z.string(),
  coverType: z.string(),
  theme: z.string(),
  pageCount: z.number().int(),
  basePrice: z.number(),
  extraPagesPrice: z.number(),
  packagingPrice: z.number(),
  quantity: z.number().int().min(1).default(1),
  subtotal: z.number(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(), // e.g., "WB-8491"
  userId: z.string().uuid(),
  items: z.array(OrderItemSchema),
  subtotal: z.number(),
  discount: z.number().default(0),
  promoCode: z.string().optional(),
  shippingCost: z.number().default(0),
  totalAmount: z.number(),
  depositAmount: z.number().optional(),
  balanceDue: z.number().optional(),
  paymentMethod: PaymentMethodEnum,
  paymentStatus: PaymentStatusEnum,
  orderStatus: OrderStatusEnum,
  deliveryType: DeliveryTypeEnum.default("standard"),
  isGift: z.boolean().default(false),
  giftMessage: z.string().optional(),
  shippingAddress: z.object({
    fullName: z.string(),
    phone: z.string(),
    alternatePhone: z.string().optional(),
    pinCode: z.string(),
    city: z.string(),
    state: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    landmark: z.string().optional(),
    type: z.enum(["home", "work", "other"]).default("home"),
  }),
  trackingId: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  courierPartner: z.string().optional(),
  estimatedDispatchDate: z.string().datetime().optional(),
  estimatedDeliveryDate: z.string().datetime().optional(),
  printPdfUrl: z.string().url().optional(),
  recipients: z.array(z.object({
    recipientName: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    giftMessage: z.string().optional(),
    itemIndexes: z.array(z.number()).optional(),
  })).optional(),
  auditLog: z.array(z.object({
    action: z.string(),
    updatedBy: z.string(),
    timestamp: z.union([z.string(), z.date()]),
    details: z.string().optional(),
    previousValue: z.any().optional(),
    newValue: z.any().optional(),
  })).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Order = z.infer<typeof OrderSchema>;

// ─── Promo Code ─────────────────────────────────────────────────────────────

export const PromoCodeSchema = z.object({
  id: z.string(),
  code: z.string().min(3).max(30),
  description: z.string().optional(),
  discountType: z.enum(["flat", "fixed", "percentage"]),
  discountValue: z.number().positive(),
  maxDiscountAmount: z.number().optional().nullable(),
  minOrderAmount: z.number().default(0),
  audienceType: z.enum(["ALL", "FIRST_ORDER", "SPECIFIC_USERS"]).default("ALL"),
  allowedUserEmails: z.array(z.string()).default([]),
  maxUses: z.number().int().optional().nullable(),
  currentUses: z.number().int().default(0),
  maxUsesPerUser: z.number().int().default(1),
  startDate: z.union([z.string(), z.date()]).optional(),
  expiresAt: z.union([z.string(), z.date()]).optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});
export type PromoCode = z.infer<typeof PromoCodeSchema>;
