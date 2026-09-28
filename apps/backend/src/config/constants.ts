// apps/backend/src/config/constants.ts

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PRODUCTION: 'production',
  PRINTING: 'printing',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const PRODUCTION_STATUS = {
  PENDING: 'pending',
  RENDERING: 'rendering',
  PRINTING: 'printing',
  QC: 'qc',
  READY: 'ready',
} as const;

export const TICKET_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
} as const;

export const OTP_CONFIG = {
  EXPIRY_MINUTES: 10,
  LENGTH: 6,
};
