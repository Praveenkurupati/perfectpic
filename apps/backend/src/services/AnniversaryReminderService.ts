// apps/backend/src/services/AnniversaryReminderService.ts
import mongoose from 'mongoose';
import { Order, IOrder } from '../db/models/Order';
import { User } from '../db/models/User';
import { PromoCode } from '../db/models/PromoCode';
import { isDbConnected } from '../db/connection';
import { WhatsappService } from './WhatsappService';
import { mailService } from './MailService';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export type OccasionType = 'anniversary' | 'wedding' | 'travel' | 'baby' | 'birthday' | 'annual' | 'holiday' | 'other';

export interface IMilestoneCandidate {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderTitle: string;
  orderDate: Date;
  daysSinceOrder: number;
  yearsElapsed: number;
  nextAnniversaryYear: number;
  nextAnniversaryDate: Date;
  daysUntil: number;
  stage: number; // 1: 36-65d (Nostalgia), 2: 15-35d (15% Incentive), 3: 0-14d (Urgency)
  stageName: string;
  occasionType: OccasionType;
  milestoneLabel: string;
  thumbnail?: string;
  coverUrl?: string;
  orderTotal: number;
  remindersSent: Array<{
    stage: number;
    sentAt: Date | string;
    channel: string;
    promoCode?: string;
  }>;
  hasSentCurrentStage: boolean;
  reorderUrl: string;
  isOptedOut?: boolean;
}

export interface IAnniversaryMetrics {
  totalUpcomingMilestones30d: number;
  totalUpcomingMilestones60d: number;
  totalRemindersSent: number;
  repeatConversionRate: number; // e.g. 24.8%
  attributedRevenue: number; // ₹ generated from repeat orders with ANNIVERSARY15
  repeatOrdersCount: number;
  stageBreakdown: {
    stage1: number; // Nostalgia (36-65d)
    stage2: number; // 15% Incentive (15-35d)
    stage3: number; // Final Urgency (0-14d)
  };
  occasionBreakdown: Record<OccasionType, number>;
  channelDeliveryRate: {
    whatsapp: number;
    email: number;
  };
  lastSweepAt?: string;
}

export interface IReminderDispatchResult {
  orderId: string;
  orderNumber: string;
  customerName: string;
  success: boolean;
  stage: number;
  occasionType: OccasionType;
  channels: {
    whatsapp?: { dispatched: boolean; simulated?: boolean; error?: string };
    email?: { dispatched: boolean; simulated?: boolean; error?: string };
  };
  promoCode?: string;
  message?: string;
}

export class AnniversaryReminderService {
  private static lastSchedulerRun: Date | null = null;
  public static readonly PROMO_CODE = 'ANNIVERSARY15';
  public static readonly PROMO_DISCOUNT_PERCENT = 15;

  /**
   * Ensure the annual loyalty promo code ANNIVERSARY15 exists in MongoDB
   */
  public static async ensurePromoCodeExists(): Promise<void> {
    if (!isDbConnected()) return;
    try {
      const existing = await PromoCode.findOne({ code: this.PROMO_CODE });
      if (!existing) {
        await PromoCode.create({
          code: this.PROMO_CODE,
          description: '15% Off Annual Anniversary & Milestone Photobook Loyalty Incentive',
          discountType: 'percentage',
          discountValue: this.PROMO_DISCOUNT_PERCENT,
          minOrderAmount: 999,
          audienceType: 'ALL',
          isActive: true,
          startDate: new Date(),
        });
        logger.info(`🎁 [AnniversaryReminderService] Seeded ${this.PROMO_CODE} loyalty promo code in database.`);
      }
    } catch (err: any) {
      logger.warn('Notice: Could not verify ANNIVERSARY15 promo code existence:', err.message);
    }
  }

  /**
   * Intelligently infer occasion type and celebration label from order title and metadata
   */
  public static inferOccasion(title: string, metadata?: any): {
    type: OccasionType;
    label: string;
    badgeColor: string;
    icon: string;
  } {
    const raw = (title || '').toLowerCase();

    // Check explicit metadata first
    if (metadata?.occasion?.type) {
      const type = metadata.occasion.type as OccasionType;
      const label = metadata.occasion.milestoneLabel || title || 'Anniversary Keepsake';
      return {
        type,
        label,
        badgeColor: this.getOccasionBadgeColor(type),
        icon: this.getOccasionIcon(type),
      };
    }

    if (raw.includes('anniversary')) {
      return {
        type: 'anniversary',
        label: title.replace(/keepsake|photobook|custom/gi, '').trim() || 'Anniversary Keepsake',
        badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        icon: 'heart',
      };
    }

    if (raw.includes('wedding') || raw.includes('shaadi') || raw.includes('marriage') || raw.includes('bride') || raw.includes('groom')) {
      return {
        type: 'wedding',
        label: title || 'Wedding Anniversary',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: 'rings',
      };
    }

    if (raw.includes('baby') || raw.includes('newborn') || raw.includes('1st year') || raw.includes('first year') || raw.includes('toddler')) {
      return {
        type: 'baby',
        label: title || "Baby's 1st Year Milestones",
        badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: 'baby',
      };
    }

    if (raw.includes('birthday') || raw.includes('bday')) {
      return {
        type: 'birthday',
        label: title || 'Birthday Celebration',
        badgeColor: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
        icon: 'cake',
      };
    }

    if (
      raw.includes('travel') ||
      raw.includes('trip') ||
      raw.includes('vacation') ||
      raw.includes('holiday') ||
      raw.includes('expedition') ||
      raw.includes('diary') ||
      raw.includes('journey') ||
      raw.includes('kerala') ||
      raw.includes('sri lanka') ||
      raw.includes('colombia') ||
      raw.includes('himalaya') ||
      raw.includes('paris') ||
      raw.includes('rajasthan')
    ) {
      return {
        type: 'travel',
        label: title || 'Annual Travel Expedition',
        badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        icon: 'plane',
      };
    }

    return {
      type: 'annual',
      label: title || 'Annual Photobook Tradition',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: 'sparkles',
    };
  }

  private static getOccasionBadgeColor(type: OccasionType): string {
    switch (type) {
      case 'wedding':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'anniversary':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'travel':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'baby':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'birthday':
        return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  }

  private static getOccasionIcon(type: OccasionType): string {
    switch (type) {
      case 'wedding':
        return 'rings';
      case 'anniversary':
        return 'heart';
      case 'travel':
        return 'plane';
      case 'baby':
        return 'baby';
      case 'birthday':
        return 'cake';
      default:
        return 'calendar';
    }
  }

  /**
   * Calculate milestone timing and drip stage based on order creation date
   */
  public static calculateMilestone(orderDate: Date | string, customEventDate?: Date | string): {
    daysSinceOrder: number;
    yearsElapsed: number;
    nextAnniversaryYear: number;
    nextAnniversaryDate: Date;
    daysUntil: number;
    stage: number;
    stageName: string;
  } {
    const now = new Date();
    const created = new Date(orderDate);

    // If customEventDate is provided, calculate anniversary relative to that day of year
    const baseDate = customEventDate ? new Date(customEventDate) : created;
    const diffMs = now.getTime() - created.getTime();
    const daysSinceOrder = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // Calculate anniversary date for current/next cycle
    const currentYear = now.getFullYear();
    let nextAnniversaryDate = new Date(baseDate);
    nextAnniversaryDate.setFullYear(currentYear);

    // If this year's date has already passed (or order was placed in this calendar year),
    // next anniversary occurs next calendar year
    if (nextAnniversaryDate.getTime() <= now.getTime() || daysSinceOrder < 180) {
      nextAnniversaryDate.setFullYear(currentYear + 1);
    }

    const msUntil = nextAnniversaryDate.getTime() - now.getTime();
    const daysUntil = Math.ceil(msUntil / (1000 * 60 * 60 * 24));
    const nextAnniversaryYear = nextAnniversaryDate.getFullYear() - baseDate.getFullYear();
    const yearsElapsed = Math.max(1, nextAnniversaryYear);

    // Stage Classification:
    // Stage 1 (36-65 days before): Nostalgia & Memory Curation Check-in
    // Stage 2 (15-35 days before): Primary 15% Off Loyalty Incentive
    // Stage 3 (0-14 days before): Final Print Production & Delivery Urgency
    let stage = 1;
    let stageName = 'Stage 1: Nostalgic Check-in (60d)';

    if (daysUntil <= 14 && daysUntil >= 0) {
      stage = 3;
      stageName = 'Stage 3: Guaranteed Delivery Urgency (14d)';
    } else if (daysUntil <= 35 && daysUntil > 14) {
      stage = 2;
      stageName = 'Stage 2: 15% Loyalty Privilege (30d)';
    } else {
      stage = 1;
      stageName = 'Stage 1: Nostalgic Check-in (60d)';
    }

    return {
      daysSinceOrder,
      yearsElapsed,
      nextAnniversaryYear,
      nextAnniversaryDate,
      daysUntil: Math.max(0, daysUntil),
      stage,
      stageName,
    };
  }

  /**
   * Generates tailored luxury WhatsApp copy for each drip stage
   */
  public static generateWhatsAppMessage(params: {
    customerName: string;
    milestoneLabel: string;
    daysUntil: number;
    stage: number;
    reorderUrl: string;
    promoCode: string;
  }): string {
    const { customerName, milestoneLabel, daysUntil, stage, reorderUrl, promoCode } = params;
    const name = customerName && customerName !== 'Guest User' ? customerName.split(' ')[0] : 'there';

    const targetUrl = reorderUrl.includes('?') ? `${reorderUrl}&promo=${promoCode}` : `${reorderUrl}?promo=${promoCode}`;

    if (stage === 1) {
      return (
        `✨ *A beautiful year of memories, ${name}.*\n\n` +
        `Your special celebration (*${milestoneLabel}*) is coming up in approximately ${daysUntil} days.\n\n` +
        `It seems like just yesterday we bound your archival photobook. As this year's chapters unfold, we invite you to begin curating your next anniversary edition.\n\n` +
        `📖 *Start gathering your photos today:*\n${targetUrl}\n\n` +
        `Warm regards,\n*The PerfectPic Concierge*`
      );
    }

    if (stage === 2) {
      return (
        `🥂 *Celebrate your upcoming ${milestoneLabel}, ${name}!*\n\n` +
        `Your milestone celebration is just ${daysUntil} days away. To honor your continued journey with PerfectPic, we have unlocked your exclusive *15% Annual Loyalty Privilege*.\n\n` +
        `Use code *${promoCode}* at checkout to receive 15% off any 8.25" or 10" layflat photobook, custom foil stamping, and heirloom presentation box.\n\n` +
        `🎁 *Claim your 15% privilege now:*\n${targetUrl}\n\n` +
        `Warm regards,\n*The PerfectPic Concierge*`
      );
    }

    // Stage 3 - Urgency
    return (
      `⏳ *Final Call: Guaranteed delivery before your ${milestoneLabel}*\n\n` +
      `Hi ${name}, your milestone is in just ${daysUntil} days! Because each PerfectPic volume is hand-bound with archival lay-flat binding and custom gold foil debossing, we recommend completing your order this week to ensure delivery right on time.\n\n` +
      `Your 15% loyalty code *${promoCode}* remains active for your order.\n\n` +
      `✨ *Finalize your commemorative edition:*\n${targetUrl}\n\n` +
      `Warm regards,\n*The PerfectPic Concierge*`
    );
  }

  /**
   * Generates luxury responsive HTML email for milestone reminders
   */
  public static generateEmailHtml(params: {
    customerName: string;
    milestoneLabel: string;
    originalTitle: string;
    daysUntil: number;
    stage: number;
    reorderUrl: string;
    promoCode: string;
    thumbnail?: string;
  }): { subject: string; html: string } {
    const { customerName, milestoneLabel, originalTitle, daysUntil, stage, reorderUrl, promoCode, thumbnail } = params;
    const name = customerName && customerName !== 'Guest User' ? customerName : 'Collector';
    const bookThumb =
      thumbnail ||
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop';

    let subject = `✨ A Year of Memories: Celebrating your upcoming ${milestoneLabel}`;
    let badgeText = 'ANNUAL RECOLLECTION';
    let headline = `Honoring your journey together.`;
    let bodyText = `Your upcoming celebration of <strong>${milestoneLabel}</strong> is approaching in ${daysUntil} days. Last year, you entrusted PerfectPic to preserve <em>${originalTitle}</em>. As the next chapter of your story unfolds, we invite you to begin shaping your next commemorative volume.`;
    let ctaText = 'Start Your Next Chapter →';

    if (stage === 2) {
      subject = `🥂 Relive your special day: 15% off your ${milestoneLabel} Photobook`;
      badgeText = 'EXCLUSIVE 15% LOYALTY PRIVILEGE';
      headline = `Your anniversary privilege awaits.`;
      bodyText = `With just ${daysUntil} days remaining until your <strong>${milestoneLabel}</strong>, we have unlocked an exclusive 15% loyalty gift for you. Use code <span style="font-family: monospace; font-weight: 700; color: #D4AF37; letter-spacing: 0.1em; background: #1a1a1a; padding: 4px 10px; border-radius: 3px;">${promoCode}</span> to create a timeless, museum-grade volume with heirloom layflat binding.`;
      ctaText = `Claim 15% with Code ${promoCode} →`;
    } else if (stage === 3) {
      subject = `⏳ Guaranteed delivery before your ${milestoneLabel}`;
      badgeText = 'FINAL PRODUCTION DEADLINE';
      headline = `Arrive in time for your celebration.`;
      bodyText = `Your <strong>${milestoneLabel}</strong> is just ${daysUntil} days away. To allow our artisan bindery sufficient time for high-definition 300 DPI multi-spread imposition, foil debossing, and express delivery, please finalize your order this week. Your 15% courtesy code <strong>${promoCode}</strong> is automatically applied.`;
      ctaText = 'Order in Time for Your Celebration →';
    }

    const targetUrl = reorderUrl.includes('?') ? `${reorderUrl}&promo=${promoCode}` : `${reorderUrl}?promo=${promoCode}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FDFCFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1A1A1A;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDFCFA;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EFECE6; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 32px 30px; text-align: center;">
              <span style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.25em; text-transform: uppercase; color: #FDFCFA; font-weight: 400; display: block;">PERFECTPIC</span>
              <span style="font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: #D4AF37; margin-top: 4px; display: block;">FINE ART ARCHIVAL PHOTOBOOKS</span>
            </td>
          </tr>

          <!-- Milestone Badge & Hero -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background-color: #F9F7F2; border: 1px solid #E6E1D8; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #9E7D23; margin-bottom: 18px;">
                ${badgeText}
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 28px; line-height: 1.3; color: #0A0A0A; margin: 0 0 16px 0; font-weight: 400;">
                ${headline}
              </h1>
              <p style="font-size: 15px; line-height: 1.7; color: #4A4A4A; margin: 0 0 24px 0;">
                Dear ${name},<br><br>
                ${bodyText}
              </p>
            </td>
          </tr>

          <!-- Featured Photobook Thumbnail & Title -->
          <tr>
            <td align="center" style="padding: 0 36px 28px 36px;">
              <div style="background-color: #FAF8F5; border: 1px solid #EAE6DF; border-radius: 4px; padding: 18px; max-width: 420px; text-align: center;">
                <img src="${bookThumb}" alt="${originalTitle}" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 2px; box-shadow: 0 8px 16px rgba(0,0,0,0.08); margin-bottom: 12px;" />
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8A8A8A; display: block;">YOUR PREVIOUS VOLUME</span>
                <span style="font-family: Georgia, serif; font-size: 16px; color: #1A1A1A; font-weight: 600; display: block; margin-top: 4px;">${originalTitle}</span>
              </div>
            </td>
          </tr>

          <!-- Promo Privilege Box (Stages 2 & 3) -->
          ${
            stage >= 2
              ? `
          <tr>
            <td align="center" style="padding: 0 36px 32px 36px;">
              <div style="background: linear-gradient(135deg, #111111 0%, #222222 100%); border: 1px solid #D4AF37; border-radius: 4px; padding: 20px 24px; text-align: center; color: #FDFCFA;">
                <span style="font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #D4AF37; display: block; margin-bottom: 6px;">YOUR ANNUAL PRIVILEGE CODE</span>
                <span style="font-family: monospace; font-size: 26px; font-weight: 700; letter-spacing: 0.18em; color: #FFFFFF; display: block; margin-bottom: 6px;">${promoCode}</span>
                <span style="font-size: 12px; color: #B3B3B3; display: block;">Save 15% on any bespoke size, leather cover, or gift keepsake box</span>
              </div>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Action CTA -->
          <tr>
            <td align="center" style="padding: 0 36px 40px 36px;">
              <a href="${targetUrl}" style="display: inline-block; background-color: #0A0A0A; color: #FDFCFA; text-decoration: none; padding: 16px 36px; border-radius: 2px; font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                ${ctaText}
              </a>
              <span style="font-size: 11px; color: #888888; display: block; margin-top: 14px;">
                100% Lay-Flat Binding • Fuji Lustre HD Paper • Custom Foil Debossing
              </span>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F6F2; padding: 24px 30px; text-align: center; border-top: 1px solid #ECE7DE; font-size: 11px; color: #7A7A7A; line-height: 1.6;">
              © ${new Date().getFullYear()} PerfectPic Archival Studio. All rights reserved.<br>
              You received this because of your order for <em>${originalTitle}</em>.<br>
              <a href="${env.FRONTEND_URL || 'https://perfectpic.in'}/settings" style="color: #4A4A4A; text-decoration: underline;">Manage notification preferences</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return { subject, html };
  }

  /**
   * Dispatches a personalized anniversary reminder for a single order
   */
  public static async sendAnniversaryReminder(
    orderId: string,
    options?: {
      stage?: number;
      channel?: 'whatsapp' | 'email' | 'all';
      customPromo?: string;
      customPhone?: string;
      customEmail?: string;
    }
  ): Promise<IReminderDispatchResult> {
    const channelChoice = options?.channel || 'all';
    const promoCode = options?.customPromo || this.PROMO_CODE;

    // 1. Fetch order from MongoDB or Repository
    let order: any = null;
    if (isDbConnected()) {
      try {
        order = await Order.findOne({
          $or: [{ _id: mongoose.isValidObjectId(orderId) ? orderId : null }, { orderNumber: orderId }, { id: orderId }],
        });
      } catch (err) {
        logger.warn('MongoDB order lookup failed, falling back to repository:', err);
      }
    }

    if (!order) {
      const { OrderRepository } = await import('../repositories/OrderRepository');
      order = await OrderRepository.findById(orderId);
    }

    if (!order) {
      return {
        orderId,
        orderNumber: orderId,
        customerName: 'Unknown',
        success: false,
        stage: options?.stage || 1,
        occasionType: 'anniversary',
        channels: {},
        message: `Order ${orderId} not found`,
      };
    }

    const customerName = order.customerName || 'Collector';
    const customerPhone = options?.customPhone || order.customerPhone || order.shippingAddress?.phone || '';
    const customerEmail = options?.customEmail || order.customerEmail || order.shippingAddress?.email || '';
    const orderTitle = order.title || order.productTitle || 'Archival Photobook';
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

    // 2. Infer occasion & calculate timing
    const occasion = this.inferOccasion(orderTitle, order);
    const timing = this.calculateMilestone(orderDate, order.occasion?.eventDate);
    const targetStage = options?.stage || timing.stage;

    const storefrontBase = env.FRONTEND_URL || 'http://localhost:3000';
    const reorderUrl = `${storefrontBase}/configure?template=first-anniversary&reorderFrom=${order.orderNumber || order.id || orderId}&occasion=${occasion.type}&promo=${promoCode}`;

    const results: IReminderDispatchResult = {
      orderId: String(order._id || order.id || orderId),
      orderNumber: order.orderNumber || orderId,
      customerName,
      success: false,
      stage: targetStage,
      occasionType: occasion.type,
      promoCode,
      channels: {},
    };

    let anyChannelSuccess = false;

    // 3. Dispatch WhatsApp if requested
    if ((channelChoice === 'whatsapp' || channelChoice === 'all') && customerPhone) {
      try {
        const waMessage = this.generateWhatsAppMessage({
          customerName,
          milestoneLabel: occasion.label,
          daysUntil: timing.daysUntil,
          stage: targetStage,
          reorderUrl,
          promoCode,
        });

        const waRes = await WhatsappService.sendTextMessage({
          to: customerPhone,
          message: waMessage,
          previewUrl: true,
        });

        results.channels.whatsapp = {
          dispatched: waRes.success,
          simulated: waRes.simulated,
          error: waRes.error,
        };

        if (waRes.success) anyChannelSuccess = true;
      } catch (waErr: any) {
        logger.error(`[AnniversaryReminderService] WhatsApp dispatch error for ${orderId}:`, waErr.message);
        results.channels.whatsapp = { dispatched: false, error: waErr.message };
      }
    }

    // 4. Dispatch Email if requested
    if ((channelChoice === 'email' || channelChoice === 'all') && customerEmail) {
      try {
        const { subject, html } = this.generateEmailHtml({
          customerName,
          milestoneLabel: occasion.label,
          originalTitle: orderTitle,
          daysUntil: timing.daysUntil,
          stage: targetStage,
          reorderUrl,
          promoCode,
          thumbnail: order.thumbnail || order.coverUrl,
        });

        const emailSent = await mailService.sendMail({
          to: customerEmail,
          subject,
          html,
          text: `Honoring your journey with PerfectPic: Your ${occasion.label} is coming up in ${timing.daysUntil} days. Create your next edition with promo code ${promoCode} at ${reorderUrl}`,
        });

        results.channels.email = {
          dispatched: emailSent,
          simulated: !mailService.isConfigured,
        };

        if (emailSent) anyChannelSuccess = true;
      } catch (emailErr: any) {
        logger.error(`[AnniversaryReminderService] Email dispatch error for ${orderId}:`, emailErr.message);
        results.channels.email = { dispatched: false, error: emailErr.message };
      }
    }

    results.success = anyChannelSuccess;

    // 5. Record reminder on Order document in database or repository
    if (anyChannelSuccess) {
      const reminderRecord = {
        stage: targetStage,
        sentAt: new Date(),
        channel: channelChoice,
        promoCode,
        recipientPhone: customerPhone,
        recipientEmail: customerEmail,
      };

      try {
        const { OrderRepository } = await import('../repositories/OrderRepository');
        await OrderRepository.recordAnniversaryReminder(String(order._id || order.id || orderId), reminderRecord);
      } catch (recordErr: any) {
        logger.warn('[AnniversaryReminderService] Could not persist reminder log on order:', recordErr.message);
      }
    }

    return results;
  }

  /**
   * Automated background sweep: processes all orders approaching their annual milestone
   */
  public static async processScheduledAnniversaries(): Promise<{
    processed: number;
    successful: number;
    stage1Count: number;
    stage2Count: number;
    stage3Count: number;
    errors: string[];
  }> {
    this.lastSchedulerRun = new Date();
    await this.ensurePromoCodeExists();

    const summary = {
      processed: 0,
      successful: 0,
      stage1Count: 0,
      stage2Count: 0,
      stage3Count: 0,
      errors: [] as string[],
    };

    try {
      const { OrderRepository } = await import('../repositories/OrderRepository');
      const candidates = await OrderRepository.findUpcomingAnniversaries({ daysWindow: 65, limit: 150 });

      logger.info(`⏰ [AnniversaryReminderService] Processing ${candidates.length} milestone candidates...`);

      for (const candidate of candidates) {
        // Skip if opted out or already sent this stage
        if (candidate.isOptedOut || candidate.hasSentCurrentStage) {
          continue;
        }

        summary.processed++;

        try {
          const dispatchRes = await this.sendAnniversaryReminder(candidate.orderId, {
            stage: candidate.stage,
            channel: 'all',
          });

          if (dispatchRes.success) {
            summary.successful++;
            if (candidate.stage === 1) summary.stage1Count++;
            if (candidate.stage === 2) summary.stage2Count++;
            if (candidate.stage === 3) summary.stage3Count++;
          } else {
            summary.errors.push(`Failed dispatch for order ${candidate.orderNumber}`);
          }
        } catch (err: any) {
          summary.errors.push(`Order ${candidate.orderNumber}: ${err.message}`);
        }
      }

      logger.info(
        `✅ [AnniversaryReminderService] Milestone sweep complete: ${summary.successful}/${summary.processed} reminders dispatched (S1: ${summary.stage1Count}, S2: ${summary.stage2Count}, S3: ${summary.stage3Count})`
      );
    } catch (err: any) {
      logger.error('❌ [AnniversaryReminderService] Error during automated milestone sweep:', err.message);
      summary.errors.push(err.message);
    }

    return summary;
  }

  /**
   * Calculate high-level CRM milestone retention and revenue metrics
   */
  public static async getMetrics(): Promise<IAnniversaryMetrics> {
    const { OrderRepository } = await import('../repositories/OrderRepository');
    return OrderRepository.getAnniversaryMetrics();
  }
}

export default AnniversaryReminderService;
