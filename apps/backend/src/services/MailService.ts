// apps/backend/src/services/MailService.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { OtpPurpose } from '../db/models/Otp';

export interface ISendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class MailService {
  private transporter: any = null;
  public isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  public initTransporter() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: Number(env.SMTP_PORT) || 465,
          secure: Number(env.SMTP_PORT) === 465 || env.SMTP_SECURE,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });
        this.isConfigured = true;
        logger.info('📧 MailService initialized with Zoho SMTP configuration', {
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
      logger.info('💡 MailService running in development simulation mode. Set SMTP_PASS in .env to send real emails via Zoho SMTP.');
      this.isConfigured = false;
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

    if (this.isConfigured && transporter) {
      try {
        const fromAddress = env.SMTP_FROM || `"PerfectPic Security" <${env.SMTP_USER || 'noreply@perfectpic.in'}>`;
        const info = await transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        });
        logger.info(`✉️ Email successfully dispatched to ${to}`, { messageId: info.messageId, subject });
        return true;
      } catch (error: any) {
        logger.error(`❌ Failed to send email to ${to}: ${error.message}`, { error });
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
    userName = 'Valued Customer',
    purpose: OtpPurpose | string = 'login'
  ): Promise<boolean> {
    const fromAddress = env.SMTP_FROM || `"PerfectPic Security" <${env.SMTP_USER || 'noreply@perfectpic.in'}>`;
    let subject = 'Your Login OTP - PerfectPic';
    let title = 'Authentication Code';
    let description = 'Your One-Time Password (OTP) for PerfectPic is:';
    let text = `Your OTP is ${otpCode}. Please do not share this with anyone. It will expire shortly.`;

    if (purpose === 'signup') {
      subject = 'Verify Your Email - PerfectPic Registration';
      title = 'Welcome to PerfectPic';
      description = 'Thank you for joining PerfectPic. Your One-Time Password (OTP) to verify your email and activate your account is:';
      text = `Welcome to PerfectPic! Your registration OTP is ${otpCode}. Please enter this code to verify your account.`;
    } else if (purpose === 'password_reset') {
      subject = 'Password Reset Code - PerfectPic';
      title = 'Reset Your Password';
      description = 'We received a request to reset your PerfectPic account password. Your verification code is:';
      text = `Your PerfectPic password reset code is ${otpCode}.`;
    } else if (purpose === 'order_verification') {
      subject = 'Order Verification Code - PerfectPic';
      title = 'Verify Your Order';
      description = 'Please confirm your photobook order with this One-Time Password (OTP):';
      text = `Your PerfectPic order verification code is ${otpCode}.`;
    }
    const html = `
      <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
        <div style="font-size: 20px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #111; text-align: center; margin-bottom: 20px;">PERFECTPIC</div>
        <h2 style="color: #2c3e50; font-size: 20px; margin-bottom: 12px; text-align: center;">${title}</h2>
        <p style="font-size: 14px; color: #555; text-align: center; margin-bottom: 20px;">${description}</p>
        <div style="background: #faf8f5; border: 2px dashed #2c3e50; border-radius: 6px; padding: 18px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2c3e50; letter-spacing: 6px; margin: 0; font-size: 36px; font-family: 'Courier New', Courier, monospace;">${otpCode}</h1>
        </div>
        <p style="font-size: 13px; color: #666; text-align: center;">Please do not share this code with anyone. It will expire shortly.</p>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; line-height: 1.6;">
          If you did not request this verification code, you can safely ignore this email.<br>
          © 2026 PerfectPic (perfectpic.in) · Archival Photobooks
        </div>
      </div>
    `;

    const transporter = this.ensureTransporter();
    if (this.isConfigured && transporter) {
      try {
        const mailOptions = {
          from: fromAddress,
          to: recipientEmail,
          subject,
          text,
          html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent successfully! Message ID:', info.messageId);
        logger.info(`✉️ OTP Email sent successfully! Message ID: ${info.messageId} to ${recipientEmail}`);
        return true;
      } catch (error: any) {
        console.error('Error occurred while sending OTP:', error);
        logger.error(`❌ Error occurred while sending OTP to ${recipientEmail}: ${error.message}`);
        return false;
      }
    }

    // Dev Simulation Fallback
    logger.info(`🔑 OTP Generated for ${recipientEmail}: [ ${otpCode} ] (Valid for 10 mins)`);
    console.log(`[SIMULATED EMAIL] To: ${recipientEmail} | OTP: [${otpCode}]`);
    return true;
  }

  public async sendOrderConfirmationEmail(toEmail: string, orderDetails: any): Promise<boolean> {
    const orderNumber = orderDetails.orderNumber || orderDetails.id || 'PP-ORDER';
    const title = orderDetails.title || 'Custom Photobook Keepsake';
    const total = (orderDetails.total || orderDetails.amount || 1999).toLocaleString('en-IN');
    const customerName = orderDetails.customerName || 'Valued Collector';
    const itemsCount = orderDetails.items?.length || 1;
    const address = orderDetails.shippingAddress
      ? `${orderDetails.shippingAddress.addressLine1 || ''}, ${orderDetails.shippingAddress.city || ''}, ${orderDetails.shippingAddress.state || ''} - ${orderDetails.shippingAddress.pincode || ''}`
      : 'Address on file';

    const subject = `Order Confirmed: #${orderNumber} — PerfectPic Keepsake in Production`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation #${orderNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 24px 12px; color: #141413; }
    .wrapper { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5ded3; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background: #141413; padding: 32px 24px; text-align: center; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #fbf9f5; margin: 0; font-family: Georgia, serif; }
    .tagline { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #c5a880; margin-top: 6px; }
    .content { padding: 36px 32px; }
    .badge { display: inline-block; background: #faf4ea; color: #8a6d3b; border: 1px solid #e0d0b8; padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 2px; margin-bottom: 16px; }
    .greeting { font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #141413; margin: 0 0 12px; }
    .subtext { font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 28px; }
    .order-box { background: #faf8f5; border: 1px solid #ede8de; border-radius: 6px; padding: 20px; margin-bottom: 28px; }
    .order-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ede8de; font-size: 13px; }
    .order-row:last-child { border-bottom: none; font-size: 15px; font-weight: 700; color: #141413; padding-top: 12px; }
    .specs-grid { background: #ffffff; border: 1px solid #ede8de; border-radius: 4px; padding: 16px; margin: 16px 0; }
    .specs-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; color: #888; margin-bottom: 8px; }
    .specs-item { font-size: 13px; color: #333; line-height: 1.5; }
    .delivery-box { background: #fdfaf6; border-left: 3px solid #c5a880; padding: 14px 18px; margin-bottom: 28px; }
    .delivery-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #141413; margin-bottom: 4px; }
    .delivery-text { font-size: 13px; color: #666; margin: 0; line-height: 1.5; }
    .footer { background: #f7f4ee; padding: 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #e5ded3; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand">PERFECTPIC</h1>
      <div class="tagline">Archival Editions · HP Indigo Digital Press</div>
    </div>
    <div class="content">
      <div class="badge">Order Confirmed & Queued</div>
      <h2 class="greeting">Thank you, ${customerName}.</h2>
      <p class="subtext">
        Your photobook order <strong>#${orderNumber}</strong> has been received and queued for precision printing on our 12-color HP Indigo press.
      </p>

      <div class="order-box">
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #141413;">
          ${title}
        </div>
        <div class="specs-grid">
          <div class="specs-title">Crafting Specifications</div>
          <div class="specs-item">• Binding: 180° Lay-Flat Zero-Gutter PUR Polyurethane</div>
          <div class="specs-item">• Paper: 200 GSM Archival Matte Velvet Synthetic</div>
          <div class="specs-item">• Certified Longevity: ISO 9706 Acid-Free (200+ Year Durability)</div>
          <div class="specs-item">• Total Books: ${itemsCount} Unit(s)</div>
        </div>
        <div class="order-row">
          <span>Order Number:</span>
          <span><strong>#${orderNumber}</strong></span>
        </div>
        <div class="order-row">
          <span>Estimated Dispatch:</span>
          <span>3–5 Business Days</span>
        </div>
        <div class="order-row">
          <span>Total Paid:</span>
          <span>₹${total}</span>
        </div>
      </div>

      <div class="delivery-box">
        <div class="delivery-title">Delivery Destination</div>
        <p class="delivery-text">${address}</p>
      </div>

      <p style="font-size: 12px; color: #777; line-height: 1.5; text-align: center;">
        Need assistance with your order? Our concierge desk is available at <a href="mailto:support@perfectpic.in" style="color: #c5a880; text-decoration: none; font-weight: 600;">support@perfectpic.in</a>.
      </p>
    </div>
    <div class="footer">
      © 2026 PerfectPic India Pvt. Ltd. · 7-Day Free Reprint Guarantee<br>
      Every book printed supports our 1-tree initiative across protected reserves.
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({ to: toEmail, subject, html });
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
