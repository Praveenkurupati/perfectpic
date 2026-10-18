// apps/backend/src/services/GiftCardService.ts
import { GiftCardRepository, CreateGiftCardDTO } from '../repositories/GiftCardRepository';
import { IGiftCard } from '../db/models/GiftCard';
import { mailService } from './MailService';
import { WhatsappService } from './WhatsappService';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export class GiftCardService {
  /**
   * Purchases and issues a digital gift card
   */
  public static async purchaseGiftCard(dto: CreateGiftCardDTO): Promise<IGiftCard> {
    const amount = Number(dto.initialAmount);
    if (!amount || amount < 100) {
      throw ApiError.badRequest('Minimum gift card denomination is ₹100.');
    }
    if (!dto.recipient?.email || !dto.recipient?.name) {
      throw ApiError.badRequest('Recipient name and email address are required.');
    }
    if (!dto.sender?.name || !dto.sender?.email) {
      throw ApiError.badRequest('Sender name and email address are required.');
    }

    const card = await GiftCardRepository.create(dto);

    // Send notifications if not scheduled for later
    if (card.isDelivered || !card.scheduledDeliveryDate) {
      this.sendGiftCardDelivery(card).catch(err => {
        logger.error(`[GiftCardService] Failed to dispatch delivery notification for ${card.code}:`, err.message);
      });
    }

    return card;
  }

  /**
   * Verifies a gift card and returns its live balance and status
   */
  public static async verifyGiftCard(code: string, pin?: string): Promise<{
    valid: boolean;
    code: string;
    balance: number;
    initialAmount: number;
    status: string;
    theme: string;
    recipientName: string;
    senderName: string;
    message?: string;
    expiresAt?: Date | null;
  }> {
    const card = await GiftCardRepository.findByCode(code);
    if (!card) {
      throw ApiError.notFound(`Gift card code '${code}' is invalid or does not exist.`);
    }

    if (card.status === 'frozen' || card.status === 'cancelled') {
      throw ApiError.badRequest(`This gift card is currently ${card.status}. Please contact support.`);
    }

    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      throw ApiError.badRequest(`This gift card expired on ${new Date(card.expiresAt).toLocaleDateString('en-IN')}.`);
    }

    if (card.currentBalance <= 0 || card.status === 'fully_redeemed') {
      throw ApiError.badRequest('This gift card has already been fully redeemed.');
    }

    if (pin && card.pin && card.pin !== pin.trim()) {
      throw ApiError.badRequest('Invalid 4-digit security PIN for this gift card.');
    }

    return {
      valid: true,
      code: card.code,
      balance: card.currentBalance,
      initialAmount: card.initialAmount,
      status: card.status,
      theme: card.theme,
      recipientName: card.recipient.name,
      senderName: card.sender.name,
      message: card.message,
      expiresAt: card.expiresAt,
    };
  }

  /**
   * Sends rich HTML digital voucher to recipient
   */
  public static async sendGiftCardDelivery(card: IGiftCard): Promise<void> {
    try {
      const formattedAmount = `₹${card.initialAmount.toLocaleString('en-IN')}`;
      const subject = `🎁 ${card.sender.name} sent you a ${formattedAmount} PerfectPic Photobook Gift Card!`;
      
      const emailHtml = `
        <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; border: 1px solid #D9D6CF; border-radius: 12px; overflow: hidden; color: #121212;">
          <div style="background: #0A0A0A; padding: 28px 24px; text-align: center;">
            <h1 style="color: #F4F2ED; margin: 0; font-size: 24px; letter-spacing: 0.1em; text-transform: uppercase;">PerfectPic</h1>
            <p style="color: #D4AF37; margin: 6px 0 0 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">Heirloom Photobooks & Keepsakes</p>
          </div>

          <div style="padding: 36px 32px; text-align: center;">
            <p style="font-size: 12px; color: #706E69; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px 0;">A Gift From The Heart</p>
            <h2 style="font-size: 26px; margin: 0 0 16px 0; color: #0A0A0A;">Dear ${card.recipient.name},</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #403E38; margin: 0 0 24px 0;">
              <strong>${card.sender.name}</strong> has gifted you a <strong>${formattedAmount}</strong> digital gift card to preserve your cherished memories in an archival, handcrafted photobook.
            </p>

            ${card.message ? `
              <div style="background: #FFFFFF; border-left: 3px solid #D4AF37; padding: 18px 20px; text-align: left; margin: 0 0 28px 0; font-style: italic; color: #504E48; font-size: 14px; border-radius: 4px;">
                "${card.message}"
              </div>
            ` : ''}

            <!-- Gift Card Voucher Box -->
            <div style="background: linear-gradient(135deg, #1C1A17 0%, #0A0A0A 100%); border: 2px solid #D4AF37; border-radius: 12px; padding: 24px; text-align: center; color: #FFFFFF; margin: 0 0 28px 0; box-shadow: 0 8px 24px rgba(0,0,0,0.12);">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #D4AF37;">Gift Card Code</span>
              <div style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 0.15em; color: #FAF9F6; margin: 10px 0;">
                ${card.code}
              </div>
              <div style="font-size: 12px; color: #A3A099;">
                Security PIN: <strong style="color: #FFFFFF; font-family: monospace;">${card.pin}</strong>
              </div>
              <div style="margin-top: 14px; font-size: 18px; font-weight: bold; color: #D4AF37;">
                Value: ${formattedAmount}
              </div>
            </div>

            <a href="https://perfectpic.in/configure?giftCard=${card.code}" style="display: inline-block; background: #0A0A0A; color: #FAF9F6; padding: 14px 32px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em;">
              Redeem & Create Your Book &rarr;
            </a>

            <p style="font-size: 11px; color: #8C8880; margin: 28px 0 0 0; line-height: 1.5;">
              Valid across all PerfectPic photobooks, extra page additions, and luxury keepsake boxes.<br/>
              Can also be claimed to your permanent account wallet balance at perfectpic.in/wallet.
            </p>
          </div>
        </div>
      `;

      await mailService.sendMail({ to: card.recipient.email, subject, html: emailHtml });

      // WhatsApp delivery if recipient phone provided
      if (card.recipient.phone) {
        const waMsg = `🎁 *Gift from ${card.sender.name}*!\n\nYou've received a *${formattedAmount}* PerfectPic Photobook Gift Card!\n\n*Code:* ${card.code}\n*PIN:* ${card.pin}\n\nCraft your custom heirloom keepsake here: https://perfectpic.in/configure?giftCard=${card.code}`;
        WhatsappService.sendTextMessage({ to: card.recipient.phone, message: waMsg }).catch(() => {});
      }
    } catch (err: any) {
      logger.warn(`Could not dispatch gift card notification: ${err.message}`);
    }
  }
}
