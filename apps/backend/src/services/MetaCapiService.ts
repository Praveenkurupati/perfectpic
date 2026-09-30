// apps/backend/src/services/MetaCapiService.ts
import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string; // _fbp browser cookie
  fbc?: string; // _fbc click ID cookie
  externalId?: string;
}

export interface MetaCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
    title?: string;
  }>;
  num_items?: number;
  order_id?: string;
  status?: string;
  [key: string]: any;
}

export interface MetaEventPayload {
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'CustomizeBook' | string;
  eventTime?: number;
  eventId?: string; // Used for deduplication with client-side Meta Pixel
  eventSourceUrl?: string;
  actionSource?: 'website' | 'app' | 'system_generated';
  userData: MetaUserData;
  customData?: MetaCustomData;
}

export class MetaCapiService {
  private static getCredentials() {
    const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '';
    const accessToken = process.env.META_ACCESS_TOKEN || '';
    const testCode = process.env.META_CAPI_TEST_CODE || '';
    return { pixelId, accessToken, testCode };
  }

  /**
   * Normalizes and SHA-256 hashes a string according to Meta specifications.
   */
  public static hashData(input?: string): string | undefined {
    if (!input) return undefined;
    const normalized = input.trim().toLowerCase();
    if (!normalized) return undefined;
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Normalizes Indian and global phone numbers (digits only, e.g. 919876543210).
   */
  public static hashPhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    let digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      digits = `91${digits}`; // Add India country code prefix if 10 digits
    }
    return crypto.createHash('sha256').update(digits).digest('hex');
  }

  /**
   * Dispatches a server-side event directly to Meta Conversions API
   */
  public static async sendEvent(payload: MetaEventPayload): Promise<{ success: boolean; eventId: string; simulated?: boolean; message?: string }> {
    const { pixelId, accessToken, testCode } = this.getCredentials();
    const eventTime = payload.eventTime || Math.floor(Date.now() / 1000);
    const eventId = payload.eventId || `meta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Build hashed user_data according to Meta CAPI specification
    const userDataFormatted: Record<string, any> = {};
    if (payload.userData.email) {
      userDataFormatted.em = [this.hashData(payload.userData.email)];
    }
    if (payload.userData.phone) {
      userDataFormatted.ph = [this.hashPhone(payload.userData.phone)];
    }
    if (payload.userData.firstName) {
      userDataFormatted.fn = [this.hashData(payload.userData.firstName)];
    }
    if (payload.userData.lastName) {
      userDataFormatted.ln = [this.hashData(payload.userData.lastName)];
    }
    if (payload.userData.city) {
      userDataFormatted.ct = [this.hashData(payload.userData.city)];
    }
    if (payload.userData.state) {
      userDataFormatted.st = [this.hashData(payload.userData.state)];
    }
    if (payload.userData.zip) {
      userDataFormatted.zp = [this.hashData(payload.userData.zip)];
    }
    if (payload.userData.country) {
      userDataFormatted.country = [this.hashData(payload.userData.country || 'in')];
    }
    if (payload.userData.clientIp) {
      userDataFormatted.client_ip_address = payload.userData.clientIp;
    }
    if (payload.userData.clientUserAgent) {
      userDataFormatted.client_user_agent = payload.userData.clientUserAgent;
    }
    if (payload.userData.fbp) {
      userDataFormatted.fbp = payload.userData.fbp;
    }
    if (payload.userData.fbc) {
      userDataFormatted.fbc = payload.userData.fbc;
    }
    if (payload.userData.externalId) {
      userDataFormatted.external_id = [this.hashData(payload.userData.externalId)];
    }

    const eventData: Record<string, any> = {
      event_name: payload.eventName,
      event_time: eventTime,
      event_id: eventId,
      event_source_url: payload.eventSourceUrl || 'https://perfectpic.in',
      action_source: payload.actionSource || 'website',
      user_data: userDataFormatted,
      custom_data: {
        currency: 'INR',
        ...(payload.customData || {}),
      },
    };

    // If Meta Access Token is not yet configured in production env, log structured simulation
    if (!pixelId || !accessToken) {
      logger.info(`[Meta CAPI Simulation] Event '${payload.eventName}' queued (eventId: ${eventId}) with value: ₹${payload.customData?.value || 0}`);
      return {
        success: true,
        eventId,
        simulated: true,
        message: 'Meta CAPI simulated successfully (configure META_PIXEL_ID & META_ACCESS_TOKEN for live upstream transmission).',
      };
    }

    try {
      const body: Record<string, any> = {
        data: [eventData],
      };
      if (testCode) {
        body.test_event_code = testCode;
      }

      const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        logger.error(`[Meta CAPI Error] HTTP ${response.status}:`, JSON.stringify(result));
        return { success: false, eventId, message: result.error?.message || 'Meta CAPI request failed' };
      }

      logger.info(`[Meta CAPI Sent] Event '${payload.eventName}' verified by Meta (eventId: ${eventId}, events_received: ${result.events_received})`);
      return { success: true, eventId, message: 'Meta CAPI event dispatched and acknowledged.' };
    } catch (error: any) {
      logger.error('[Meta CAPI Request Exception]:', error.message);
      return { success: false, eventId, message: error.message };
    }
  }
}
