// apps/backend/src/services/SmsService.ts
import { logger } from '../utils/logger';

export class SmsService {
  /**
   * Dispatch OTP SMS to customer phone number.
   * Currently runs simulated console logging.
   * When you are ready to send live SMS via Fast2SMS or Twilio, uncomment the provider code below.
   */
  public static async sendOtpSms(phone: string, otp: string): Promise<boolean> {
    logger.info(`📱 [SMS SERVICE] Sending verification OTP ${otp} to phone: ${phone}`);

    /*
    // =========================================================================
    // OPTION 1: Fast2SMS Integration (India PAN-India SMS Gateway)
    // To enable: Add FAST2SMS_API_KEY to your apps/backend/.env file and uncomment:
    // =========================================================================
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone.replace(/[^0-9]/g, ''),
        }),
      });
      const data = await response.json();
      logger.info('Fast2SMS Response:', data);
      return data.return === true;
    } catch (err: any) {
      logger.error('Fast2SMS error:', err.message);
      return false;
    }
    */

    /*
    // =========================================================================
    // OPTION 2: Twilio SMS Integration (Global & India)
    // To enable: Install twilio (`pnpm add twilio`) and uncomment:
    // =========================================================================
    try {
      const twilio = require('twilio');
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = process.env.TWILIO_PHONE_NUMBER;

      if (accountSid && authToken && fromPhone) {
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: `Your PerfectPic verification code is: ${otp}. Valid for 10 minutes.`,
          from: fromPhone,
          to: phone.startsWith('+') ? phone : `+91${phone}`,
        });
        logger.info(`Twilio SMS dispatched to ${phone}`);
        return true;
      }
    } catch (err: any) {
      logger.error('Twilio SMS error:', err.message);
      return false;
    }
    */

    return true;
  }
}

export default SmsService;
