import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { OtpPurpose } from '../db/models/Otp';
import { emailTemplateService } from './EmailTemplateService';

export interface ISendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class MailService {
  private transporter: any = null;
  public isConfigured = false;

  // Circuit Breaker State (SRE-01)
  private cbState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private cbConsecutiveFailures = 0;
  private cbLastFailureTime = 0;
  private readonly CB_FAILURE_THRESHOLD = 3;
  private readonly CB_RESET_TIMEOUT_MS = 20000; // 20s recovery cooldown
  private readonly CB_TIMEOUT_MS = 3000; // 3-second timeout guard

  constructor() {
    this.initTransporter();
  }

  public getCircuitBreakerStatus(): { state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; consecutiveFailures: number } {
    this.checkCircuitBreakerHalfOpen();
    return {
      state: this.cbState,
      consecutiveFailures: this.cbConsecutiveFailures,
    };
  }

  private checkCircuitBreakerHalfOpen(): boolean {
    if (this.cbState === 'OPEN') {
      const now = Date.now();
      if (now - this.cbLastFailureTime > this.CB_RESET_TIMEOUT_MS) {
        this.cbState = 'HALF_OPEN';
        logger.info('🔄 [SMTP CircuitBreaker] State transitioned to HALF_OPEN (probing connection)');
        return true;
      }
      return false;
    }
    return true;
  }

  private recordCircuitSuccess() {
    if (this.cbState !== 'CLOSED') {
      logger.info('✅ [SMTP CircuitBreaker] State recovered to CLOSED (SMTP connection healthy)');
    }
    this.cbState = 'CLOSED';
    this.cbConsecutiveFailures = 0;
  }

  private recordCircuitFailure(errMessage: string) {
    this.cbConsecutiveFailures++;
    this.cbLastFailureTime = Date.now();
    if (this.cbConsecutiveFailures >= this.CB_FAILURE_THRESHOLD || this.cbState === 'HALF_OPEN') {
      this.cbState = 'OPEN';
      logger.warn(`⚡ [SMTP CircuitBreaker] State transitioned to OPEN (${this.cbConsecutiveFailures} failures, reason: ${errMessage}). Fast-failing for ${this.CB_RESET_TIMEOUT_MS / 1000}s`);
    }
  }

  public initTransporter() {
    const isPlaceholderPass =
      !env.SMTP_PASS ||
      env.SMTP_PASS.trim() === 'password' ||
      env.SMTP_PASS.trim() === 'your_zoho_smtp_password' ||
      env.SMTP_PASS.trim().length === 0;

    if (env.SMTP_HOST && env.SMTP_USER && !isPlaceholderPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: Number(env.SMTP_PORT) || 465,
          secure: Number(env.SMTP_PORT) === 465 || env.SMTP_SECURE,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.isConfigured = true;
        logger.info('📧 MailService initialized with SMTP configuration', {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          user: env.SMTP_USER,
          secure: Number(env.SMTP_PORT) === 465 || env.SMTP_SECURE,
        });
      } catch (err: any) {
        logger.warn(`⚠️ MailService SMTP configuration error: ${err.message}. Using simulated email logger.`);
        this.isConfigured = false;
      }
    } else {
      if (isPlaceholderPass && env.SMTP_USER) {
        logger.warn(`⚠️ [MailService] SMTP_PASS is using a placeholder ("${env.SMTP_PASS || 'empty'}"). Real email dispatch disabled until a valid Zoho/Gmail App Password is provided in .env. Running in simulated fallback mode.`);
      } else {
        logger.info('💡 MailService running in development simulation mode. Set SMTP_PASS in .env to send real emails via Zoho SMTP.');
      }
      this.isConfigured = false;
    }
  }

  public async verifyConnection(): Promise<{ success: boolean; message: string; error?: any }> {
    if (!this.transporter || !this.isConfigured) {
      return {
        success: false,
        message: 'SMTP is not configured with active credentials (SMTP_PASS is either missing or set to placeholder).',
      };
    }
    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully!' };
    } catch (err: any) {
      return { success: false, message: `SMTP verification failed: ${err.message}`, error: err };
    }
  }

  private ensureTransporter() {
    if (!this.transporter && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.initTransporter();
    }
    return this.transporter;
  }

  public async sendMail(options: ISendMailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;
    const transporter = this.ensureTransporter();

    // Check circuit breaker status (SRE-01)
    this.checkCircuitBreakerHalfOpen();
    if (this.cbState === 'OPEN') {
      logger.warn(`⚡ [SMTP CircuitBreaker OPEN] Fast-failing email to ${to} (Subject: "${subject}") without blocking`);
      logger.info(`📨 [SIMULATED EMAIL FALLBACK] To: ${to} | Subject: "${subject}"`);
      return false;
    }

    if (this.isConfigured && transporter) {
      try {
        const fromAddress = env.SMTP_FROM || `"PerfectPic" <${env.SMTP_USER || 'noreply@perfectpic.in'}>`;

        // 3-second timeout guard using Promise.race (SRE-01)
        const sendPromise = transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SMTP send operation timed out after 3000ms')), this.CB_TIMEOUT_MS)
        );

        const info = (await Promise.race([sendPromise, timeoutPromise])) as any;
        this.recordCircuitSuccess();
        logger.info(`✉️ Email successfully dispatched to ${to}`, { messageId: info.messageId, subject });
        return true;
      } catch (error: any) {
        this.recordCircuitFailure(error?.message || 'Unknown SMTP error');
        logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
        return false;
      }
    }

    // Dev Simulation Fallback
    logger.info(`📨 [SIMULATED EMAIL] To: ${to} | Subject: "${subject}"`);
    return true;
  }

  public async sendOtpEmail(
    recipientEmail: string,
    otpCode: string,
    userName = 'Valued Collector',
    purpose: OtpPurpose | string = 'login'
  ): Promise<boolean> {
    let subject = 'Verify Your Identity';

    if (purpose === 'signup') {
      subject = 'Verify Your Identity — PerfectPic';
    } else if (purpose === 'password_reset') {
      subject = 'Verify Your Identity — Reset Password';
    } else if (purpose === 'order_verification') {
      subject = 'Verify Your Identity — Order Confirmation';
    }

    const digits = otpCode ? otpCode.split('') : [];

    // Render Handlebars template with layout & partials
    const { html, text } = emailTemplateService.renderEmail('auth/otp', {
      subject,
      title: subject,
      purpose,
      name: userName,
      otpCode,
      digits,
      expiryMinutes: 10,
    });

    const transporter = this.ensureTransporter();
    if (this.isConfigured && transporter) {
      try {
        const fromAddress = env.SMTP_FROM || `"PerfectPic" <${env.SMTP_USER || 'noreply@perfectpic.in'}>`;
        const mailOptions = {
          from: fromAddress,
          to: recipientEmail,
          subject,
          text,
          html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ [MailService] OTP Email successfully dispatched to ${recipientEmail}! Message ID: ${info.messageId}`);
        logger.info(`✉️ OTP Email sent successfully! Message ID: ${info.messageId} to ${recipientEmail}`);
        return true;
      } catch (error: any) {
        console.error(`❌ [MailService] Failed to send OTP to ${recipientEmail}:`, error.message);
        logger.error(`❌ Error occurred while sending OTP to ${recipientEmail}: ${error.message}`);
        return false;
      }
    }

    // Dev / Staging Simulation Fallback
    logger.info(`🔑 OTP Generated for ${recipientEmail}: [ ${otpCode} ] (Valid for 10 mins)`);
    console.log(`\n======================================================`);
    console.log(`📬 [SIMULATED EMAIL DISPATCH] (Handlebars template rendered)`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: "${subject}"`);
    console.log(`OTP Code: [ ${otpCode} ]`);
    console.log(`Note: To dispatch real emails to inboxes, set valid SMTP_PASS in .env`);
    console.log(`======================================================\n`);
    return true;
  }

  public async sendOrderConfirmationEmail(toEmail: string, orderDetails: any): Promise<boolean> {
    const orderNumber = orderDetails.orderNumber || orderDetails.id || 'PP-ORDER';
    const title = orderDetails.title || 'Custom Photobook Keepsake';
    const total = orderDetails.total || orderDetails.amount || 1999;
    const customerName = orderDetails.customerName || 'Valued Collector';
    const itemsCount = orderDetails.items?.length || 1;
    const address = orderDetails.shippingAddress
      ? `${orderDetails.shippingAddress.addressLine1 || ''}, ${orderDetails.shippingAddress.city || ''}, ${orderDetails.shippingAddress.state || ''} - ${orderDetails.shippingAddress.pincode || ''}`
      : 'Address on file';

    const subject = `Order Confirmed: #${orderNumber} — PerfectPic Keepsake in Production`;

    // Render Handlebars template with layout & partials
    const { html, text } = emailTemplateService.renderEmail('orders/order-confirmed', {
      subject,
      title,
      orderNumber,
      total,
      customerName,
      itemsCount,
      address,
    });

    return this.sendMail({ to: toEmail, subject, html, text });
  }

  public async sendDispatchEmail(toEmail: string, orderDetails: any, trackingInfo: { carrier: string; trackingNumber: string; trackingUrl: string }): Promise<boolean> {
    const orderNumber = orderDetails.orderNumber || orderDetails.id || 'PP-ORDER';
    const title = orderDetails.title || 'Custom Photobook Keepsake';
    const customerName = orderDetails.customerName || 'Valued Collector';
    const carrier = trackingInfo.carrier || 'BlueDart Express';
    const trackingNumber = trackingInfo.trackingNumber || 'BD100982341IN';
    const trackingUrl = trackingInfo.trackingUrl || `https://www.bluedart.com/tracking`;

    const subject = `Your Keepsake Has Shipped! #${orderNumber} (${carrier} Tracking)`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Has Shipped</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 24px 12px; color: #141413; }
    .wrapper { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5ded3; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background: #141413; padding: 32px 24px; text-align: center; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #fbf9f5; margin: 0; font-family: Georgia, serif; }
    .tagline { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #c5a880; margin-top: 6px; }
    .content { padding: 36px 32px; }
    .badge { display: inline-block; background: #eaf6ea; color: #2e7d32; border: 1px solid #c8e6c9; padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 2px; margin-bottom: 16px; }
    .greeting { font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #141413; margin: 0 0 12px; }
    .subtext { font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 28px; }
    .tracking-card { background: #faf8f5; border: 1px solid #ede8de; border-radius: 6px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .tracking-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; color: #888; margin-bottom: 6px; }
    .tracking-no { font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; color: #141413; letter-spacing: 0.15em; margin-bottom: 18px; }
    .track-btn { display: inline-block; background: #141413; color: #faf8f5; padding: 12px 28px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .footer { background: #f7f4ee; padding: 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #e5ded3; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand">PERFECTPIC</h1>
      <div class="tagline">Archival Editions · Dispatched for Safe Transit</div>
    </div>
    <div class="content">
      <div class="badge">Dispatched & In Transit</div>
      <h2 class="greeting">It&rsquo;s on the way, ${customerName}!</h2>
      <p class="subtext">
        Great news! Your archival photobook <strong>${title}</strong> (Order <strong>#${orderNumber}</strong>) has successfully cleared final quality inspection and is now in transit with our logistics partner.
      </p>

      <div class="tracking-card">
        <div class="tracking-label">Carrier & AWB Number</div>
        <div class="tracking-no">${carrier} · ${trackingNumber}</div>
        <a href="${trackingUrl}" target="_blank" class="track-btn">Track Shipment Live</a>
      </div>

      <p style="font-size: 12px; color: #777; line-height: 1.5; text-align: center;">
        Handled with protective moisture-sealed packaging and reinforced corner buffers to ensure pristine delivery.
      </p>
    </div>
    <div class="footer">
      © 2026 PerfectPic India Pvt. Ltd. · 7-Day Free Reprint Guarantee<br>
      Questions? Reach our shipping desk at <a href="mailto:support@perfectpic.in" style="color: #c5a880; text-decoration: none;">support@perfectpic.in</a>.
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({ to: toEmail, subject, html });
  }
}

export const mailService = new MailService();
export default mailService;
