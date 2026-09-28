// apps/backend/src/services/WhatsappService.ts
import { logger } from '../utils/logger';

export class WhatsappService {
  /**
   * Dispatch OTP through WhatsApp.
   * Currently logs simulated message.
   * When you are ready to enable WhatsApp Cloud API or Twilio WhatsApp, uncomment below.
   */
  public static async sendOtpWhatsapp(phone: string, otp: string): Promise<boolean> {
    logger.info(`💬 [WHATSAPP SERVICE] Sending verification OTP ${otp} to WhatsApp: ${phone}`);

    /*
    // =========================================================================
    // OPTION 1: Meta WhatsApp Business Cloud API (Official)
    // To enable: Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env and uncomment:
    // =========================================================================
    try {
      const token = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (token && phoneId) {
        const cleanNumber = phone.replace(/[^0-9]/g, '');
        const recipient = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;

        const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'template',
            template: {
              name: 'perfectpic_verification_code',
              language: { code: 'en' },
              components: [
                {
                  type: 'body',
                  parameters: [{ type: 'text', text: otp }]
                }
              ]
            }
          }),
        });

        const data = await response.json();
        logger.info('WhatsApp Cloud API response:', data);
        return response.ok;
      }
    } catch (err: any) {
      logger.error('WhatsApp Cloud API error:', err.message);
      return false;
    }
    */

    /*
    // =========================================================================
    // OPTION 2: Twilio WhatsApp Sandbox / Business
    // To enable: Install twilio (`pnpm add twilio`) and uncomment:
    // =========================================================================
    try {
      const twilio = require('twilio');
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

      if (accountSid && authToken) {
        const client = twilio(accountSid, authToken);
        const to = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+91${phone}`;
        await client.messages.create({
          body: `*PerfectPic Verification*\n\nYour security code is: *${otp}*.\nValid for 10 minutes.\nDo not share this code.`,
          from: twilioWhatsappNumber,
          to,
        });
        logger.info(`Twilio WhatsApp message dispatched to ${phone}`);
        return true;
      }
    } catch (err: any) {
      logger.error('Twilio WhatsApp error:', err.message);
      return false;
    }
    */

    return true;
  }
}

export default WhatsappService;
