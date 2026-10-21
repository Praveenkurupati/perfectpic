/**
 * PerfectPic Client Terminology & Business Language Dictionary
 * 
 * Provides customer-friendly, luxury consumer terminology across the storefront,
 * cart, checkout, account, and orders. Enforces the strict rule that end-customers
 * never see database IDs, engineering queues, developer acronyms, or technical jargon.
 */

/**
 * Formats an order identifier for display to customers.
 * Replaces raw 24-character hex ObjectIds or technical UUIDs with clean, branded '#PP-XXXXXX' identifiers.
 */
export function formatCustomerOrderNumber(orderIdOrNumber?: string): string {
  if (!orderIdOrNumber) return 'Order in Progress';
  
  // If already formatted like PP-XXXX or #PP-XXXX
  if (/^#?PP-\d+/i.test(orderIdOrNumber)) {
    return orderIdOrNumber.startsWith('#') ? orderIdOrNumber : `#${orderIdOrNumber}`;
  }
  
  // If it's a 24-char MongoDB ObjectId or a UUID, generate a customer-friendly short reference
  if (/^[0-9a-fA-F]{24}$/.test(orderIdOrNumber)) {
    const shortRef = orderIdOrNumber.slice(-6).toUpperCase();
    return `#PP-${shortRef}`;
  }
  
  if (orderIdOrNumber.includes('-')) {
    const parts = orderIdOrNumber.split('-');
    const lastPart = (parts[parts.length - 1] || '').slice(0, 6).toUpperCase();
    return `#PP-${lastPart || 'ORDER'}`;
  }
  
  return `#PP-${orderIdOrNumber.slice(0, 6).toUpperCase()}`;
}

/**
 * Customer-facing status labels for order progression.
 * Translates internal stage keys into warm, reassuring, luxury photobook crafting steps.
 */
export const CUSTOMER_ORDER_STATUS_LABELS: Record<string, { label: string; description: string }> = {
  placed: {
    label: 'Order Confirmed',
    description: 'We have received your order and our artisan team is preparing your photobook.',
  },
  confirmed: {
    label: 'Design Verified',
    description: 'Your layout and high-resolution photos have passed preflight verification.',
  },
  production: {
    label: 'Crafting in Progress',
    description: 'Your photobook is being printed on our digital presses with archival inks.',
  },
  printing: {
    label: 'Press Printing',
    description: 'Printing on luxury 200 GSM Lustre paper with 6-color digital fidelity.',
  },
  qc: {
    label: 'Artisan Binding & QC',
    description: 'Hand-assembled layflat binding, thermal binding, and meticulous quality inspection.',
  },
  dispatched: {
    label: 'Handed to Courier',
    description: 'Carefully packaged in a custom keepsake box and handed to our air express courier.',
  },
  in_transit: {
    label: 'On the Way',
    description: 'Your package is on its way to your doorstep with real-time tracking.',
  },
  delivered: {
    label: 'Delivered',
    description: 'Delivered to your doorstep. Cherish your memories!',
  },
  cancelled: {
    label: 'Order Cancelled',
    description: 'This order has been cancelled and refunded if applicable.',
  },
};

/**
 * Formats delivery and shipping tier names without technical queue or SLA references.
 */
export const DELIVERY_SERVICE_TIERS = {
  standard: {
    name: 'Standard Delivery',
    tagline: 'Carefully printed & delivered in 4–6 business days',
    badge: 'Complimentary',
  },
  express: {
    name: 'Express Delivery',
    tagline: 'Expedited crafting & express courier in 2–3 business days',
    badge: 'Popular',
  },
  rush: {
    name: 'Priority Rush Dispatch',
    tagline: 'First-priority crafting with guaranteed 24-hour dispatch and air express delivery',
    badge: '⚡ 24-Hour Dispatch Guarantee',
  },
};
