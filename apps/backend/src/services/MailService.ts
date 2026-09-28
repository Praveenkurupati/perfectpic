// apps/backend/src/services/MailService.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface ISendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class MailService {
  private transporter: any = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });
        this.isConfigured = true;
        logger.info('📧 MailService initialized with SMTP configuration', { host: env.SMTP_HOST, port: env.SMTP_PORT });
      } catch (err: any) {
        logger.warn(`⚠️ MailService SMTP configuration error: ${err.message}. Using simulated email logger.`);
        this.isConfigured = false;
      }
    } else {
      logger.info('💡 MailService running in development mode (No SMTP set). OTPs and notifications will be logged to console.');
      this.isConfigured = false;
    }
  }

  public async sendMail(options: ISendMailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: env.SMTP_FROM,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        });
        logger.info(`✉️ Email successfully dispatched to ${to}`, { messageId: info.messageId, subject });
        return true;
      } catch (error: any) {
        logger.error(`❌ Failed to send email to ${to}: ${error.message}`, { error });
        // Don't crash, fallback to logging
      }
    }

    // Dev Simulation Fallback
    logger.info(`📨 [SIMULATED EMAIL] To: ${to} | Subject: "${subject}"`);
    return true;
  }

  public async sendOtpEmail(toEmail: string, otp: string, userName = 'Valued Customer'): Promise<boolean> {
    const subject = `Your PerfectPic Verification Code: ${otp}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your PerfectPic OTP Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 24px; color: #1a1a1a; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e5e5; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: #0a0a0a; text-align: center; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 12px; color: #111; }
    .subtitle { font-size: 14px; text-align: center; color: #666; margin-bottom: 28px; line-height: 1.5; }
    .otp-box { background: #faf8f5; border: 2px dashed #0a0a0a; border-radius: 8px; padding: 18px 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #0a0a0a; font-family: 'Courier New', Courier, monospace; }
    .expiry { font-size: 12px; color: #888; text-align: center; margin-top: 8px; }
    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 32px; border-top: 1px solid #f0f0f0; padding-top: 20px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">PERFECTPIC</div>
    <div class="title">Verify Your Account</div>
    <div class="subtitle">Hello ${userName}, use the one-time verification code below to securely access your PerfectPic photobooks.</div>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="expiry">Valid for 10 minutes · Do not share this code with anyone</div>
    </div>
    <div class="footer">
      If you did not request this verification code, you can safely ignore this email.<br>
      © 2026 PerfectPic (perfectpic.in) · Archival Photobooks That Last Generations
    </div>
  </div>
</body>
</html>
    `;

    logger.info(`🔑 OTP Generated for ${toEmail}: [ ${otp} ] (Valid for 10 mins)`);
    return this.sendMail({ to: toEmail, subject, html });
  }

  public async sendOrderConfirmationEmail(toEmail: string, orderDetails: any): Promise<boolean> {
    const subject = `Order Confirmed: ${orderDetails.orderNumber} - PerfectPic`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Order Confirmed!</h2>
        <p>Thank you for choosing PerfectPic. Your order <strong>${orderDetails.orderNumber}</strong> is now in production.</p>
        <p><strong>Item:</strong> ${orderDetails.title}</p>
        <p><strong>Total:</strong> ₹${orderDetails.total?.toLocaleString('en-IN')}</p>
      </div>
    `;
    return this.sendMail({ to: toEmail, subject, html });
  }
}

export const mailService = new MailService();
export default mailService;
