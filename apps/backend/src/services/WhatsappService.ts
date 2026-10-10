// apps/backend/src/services/WhatsappService.ts
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface ISendWhatsappTextOptions {
  to: string;
  message: string;
  previewUrl?: boolean;
}

export interface ISendWhatsappTemplateOptions {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    sub_type?: 'url' | 'quick_reply';
    index?: string;
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      [key: string]: any;
    }>;
  }>;
}

export interface IWhatsappDispatchResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export class WhatsappService {
  private static readonly REQUEST_TIMEOUT_MS = 5000;

  /**
   * Check if live Kapso credentials are present and WhatsApp is enabled
   */
  public static get isConfigured(): boolean {
    return Boolean(
      env.WHATSAPP_ENABLED &&
      env.KAPSO_API_KEY &&
      env.KAPSO_PHONE_NUMBER_ID &&
      env.KAPSO_API_KEY.trim() !== '' &&
      env.KAPSO_PHONE_NUMBER_ID.trim() !== ''
    );
  }

  /**
   * Formats candidate phone numbers to E.164 format without '+' prefix as expected by Meta Cloud API
   * Examples:
   *  "+91 98765 43210" -> "919876543210"
   *  "9876543210"      -> "919876543210" (defaults to India 91 for 10-digit mobile)
   *  "09876543210"     -> "919876543210"
   */
  public static formatPhoneNumber(rawPhone: string): string {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');

    // Strip leading trunk zero if present (e.g. 09876543210 -> 9876543210)
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    // Default to India country code (+91) if 10-digit standard mobile number
    if (digits.length === 10) {
      digits = `91${digits}`;
    }

    return digits;
  }

  /**
   * Dispatches a freeform text message via Kapso.ai Meta WhatsApp v24.0 API.
   * Works immediately in Kapso Sandbox for activated test numbers, and during 24-hour customer service windows in production.
   */
  public static async sendTextMessage(options: ISendWhatsappTextOptions): Promise<IWhatsappDispatchResult> {
    const { to, message, previewUrl = false } = options;
    const recipient = this.formatPhoneNumber(to);

    if (!recipient) {
      logger.warn('⚠️ [WhatsappService] Missing or invalid recipient phone number for WhatsApp message');
      return { success: false, error: 'Invalid recipient phone number' };
    }

    if (!this.isConfigured) {
      logger.info(`💬 [SIMULATED WHATSAPP MESSAGE] To: ${recipient}\n${message}`);
      return { success: true, simulated: true };
    }

    const endpoint = `${env.KAPSO_BASE_URL.replace(/\/+$/, '')}/${env.KAPSO_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: message,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-API-Key': env.KAPSO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status} ${response.statusText}`;
        logger.error(`❌ [WhatsappService] Kapso API error (${response.status}):`, errorMsg);
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id || data?.id;
      logger.info(`✅ [WhatsappService] WhatsApp text successfully dispatched to ${recipient}. Msg ID: ${messageId || 'ok'}`);
      return { success: true, messageId };
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      const msg = isTimeout ? `Request timed out after ${this.REQUEST_TIMEOUT_MS}ms` : err.message;
      logger.error(`❌ [WhatsappService] Failed to dispatch WhatsApp message to ${recipient}:`, msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Dispatches a pre-approved Meta WhatsApp Template message via Kapso.ai.
   * Required for business-initiated notifications outside of the 24-hour service window in production.
   */
  public static async sendTemplateMessage(options: ISendWhatsappTemplateOptions): Promise<IWhatsappDispatchResult> {
    const { to, templateName, languageCode = 'en', components } = options;
    const recipient = this.formatPhoneNumber(to);

    if (!recipient) {
      return { success: false, error: 'Invalid recipient phone number' };
    }

    if (!this.isConfigured) {
      logger.info(`💬 [SIMULATED WHATSAPP TEMPLATE] To: ${recipient} | Template: ${templateName} (${languageCode})`);
      return { success: true, simulated: true };
    }

    const endpoint = `${env.KAPSO_BASE_URL.replace(/\/+$/, '')}/${env.KAPSO_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components && components.length > 0 ? { components } : {}),
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-API-Key': env.KAPSO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status}`;
        logger.error(`❌ [WhatsappService] Kapso template API error:`, errorMsg);
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id || data?.id;
      logger.info(`✅ [WhatsappService] Template '${templateName}' sent to ${recipient}. Msg ID: ${messageId}`);
      return { success: true, messageId };
    } catch (err: any) {
      logger.error(`❌ [WhatsappService] Template dispatch error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // =========================================================================
  // DOMAIN-SPECIFIC BUSINESS DISPATCHERS
  // =========================================================================

  /**
   * 1. Authentication & Security OTP Verification
   */
  public static async sendOtpWhatsapp(phone: string, otp: string, purpose: string = 'login'): Promise<boolean> {
    const purposeLabel = purpose === 'signup' 
      ? 'Account Registration' 
      : purpose === 'password_reset' 
      ? 'Password Reset' 
      : purpose === 'order_verification' 
      ? 'Order Confirmation' 
      : 'Verification';

    const message = 
      `*PerfectPic — ${purposeLabel}*\n\n` +
      `Your one-time security code is: *${otp}*\n\n` +
      `⏱️ Valid for 10 minutes.\n` +
      `🔒 Never share this code with anyone. PerfectPic artisans or staff will never ask for your verification code.`;

    const res = await this.sendTextMessage({ to: phone, message });
    return res.success;
  }

  /**
   * 2. Order Placement Confirmation
   */
  public static async sendOrderConfirmation(
    phone: string,
    order: {
      orderNumber: string;
      title?: string;
      total?: number;
      customerName?: string;
      itemsCount?: number;
    }
  ): Promise<boolean> {
    const name = order.customerName ? ` ${order.customerName}` : '';
    const formattedTotal = Number(order.total || 0).toLocaleString('en-IN');
    const orderTitle = order.title || 'Archival Photobook Keepsake';
    const trackingLink = `${env.FRONTEND_URL}/orders`;

    const message =
      `*Order Confirmed — PerfectPic Keepsakes* 📸✨\n\n` +
      `Hello${name},\n` +
      `Thank you for your order! Your heirloom photobook is now scheduled for artisanal printing.\n\n` +
      `📋 *Order Number:* #${order.orderNumber}\n` +
      `📖 *Keepsake:* ${orderTitle}\n` +
      `💰 *Total Amount:* ₹${formattedTotal}\n\n` +
      `Each photobook is precision crafted and bound in Bengaluru within 48 to 72 hours.\n\n` +
      `View your order status anytime:\n${trackingLink}`;

    const res = await this.sendTextMessage({ to: phone, message });
    return res.success;
  }

  /**
   * 3. Dispatch & Shipping Tracking Notification
   */
  public static async sendDispatchNotification(
    phone: string,
    order: {
      orderNumber: string;
      title?: string;
      customerName?: string;
    },
    tracking: {
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string;
    }
  ): Promise<boolean> {
    const name = order.customerName ? ` ${order.customerName}` : '';
    const trackingUrl = tracking.trackingUrl || `https://www.bluedart.com/tracking?awb=${tracking.trackingNumber}`;

    const message =
      `*Your Keepsake is on the Way!* 🚚📦\n\n` +
      `Hello${name},\n` +
      `Great news! Your PerfectPic order *#${order.orderNumber}* has been inspected, carefully packaged, and dispatched.\n\n` +
      `🚚 *Courier Partner:* ${tracking.carrier}\n` +
      `🔖 *Tracking / AWB:* ${tracking.trackingNumber}\n\n` +
      `📍 *Track Shipment:* ${trackingUrl}\n\n` +
      `Standard insured delivery takes 3 to 5 business days across India.`;

    const res = await this.sendTextMessage({ to: phone, message });
    return res.success;
  }

  /**
   * 4. Order Delivered & Review Request
   */
  public static async sendDeliveryNotification(
    phone: string,
    order: {
      orderNumber: string;
      title?: string;
      customerName?: string;
    }
  ): Promise<boolean> {
    const name = order.customerName ? ` ${order.customerName}` : '';
    const reviewLink = `${env.FRONTEND_URL}/orders`;

    const message =
      `*Delivered — Cherish Your Memories!* 🎁✨\n\n` +
      `Hello${name},\n` +
      `Your PerfectPic photobook *#${order.orderNumber}* has been successfully delivered!\n\n` +
      `We hope your memories look as breathtaking in your hands as they did on screen.\n\n` +
      `🌟 How was your experience? Leave a quick review:\n${reviewLink}`;

    const res = await this.sendTextMessage({ to: phone, message });
    return res.success;
  }

  /**
   * 5. Abandoned Photobook Project / Draft Nudge
   */
  public static async sendProjectReminder(
    phone: string,
    project: {
      title: string;
      projectId: string;
      pageCount?: number;
      customerName?: string;
    }
  ): Promise<boolean> {
    const name = project.customerName ? ` ${project.customerName}` : '';
    const editUrl = `${env.FRONTEND_URL}/editor/${project.projectId}`;

    const message =
      `*Your Keepsake is Waiting for You* 📖✨\n\n` +
      `Hello${name},\n` +
      `You left some beautiful moments in your draft photobook *"${project.title}"*.\n\n` +
      `Your photos and layout are safely preserved. Pick up right where you left off and bring your memories into print:\n\n` +
      `👉 Continue Editing: ${editUrl}`;

    const res = await this.sendTextMessage({ to: phone, message });
    return res.success;
  }

  /**
   * 6. Customer Support Concierge / Ticket Update
   */
  public static async sendSupportTicketUpdate(
    phone: string,
    ticket: {
      ticketId: string;
      subject: string;
      status: string;
      customerName?: string;
      messageSnippet?: string;
    }
  ): Promise<boolean> {
    const name = ticket.customerName ? ` ${ticket.customerName}` : '';
    const message =
      `*PerfectPic Concierge Support* 🛎️\n\n` +
      `Hello${name},\n` +
      `Update regarding your support inquiry *#${ticket.ticketId}* ("${ticket.subject}"):\n\n` +
      `📌 *Status:* ${ticket.status.toUpperCase()}\n` +
      (ticket.messageSnippet ? `💬 *Note:* ${ticket.messageSnippet}\n\n` : '\n') +
      `Our team is available 10 AM – 7 PM IST to assist you with any questions.`;

    const res = await this.sendTextMessage({ to: phone, message });
    return res.success;
  }
}

export default WhatsappService;
