// apps/backend/src/routes/v1/giftCards.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import razorpay from '../../lib/razorpay';
import { env } from '../../config/env';
import { GiftCardService } from '../../services/GiftCardService';
import { GiftCardRepository } from '../../repositories/GiftCardRepository';
import { StoreCreditService } from '../../services/StoreCreditService';
import { authenticate, adminOnly, optionalAuth } from '../../middlewares/auth.middleware';
import { ApiError } from '../../utils/apiError';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/v1/gift-cards/purchase
 * Prepares Razorpay payment order for purchasing a gift card
 */
router.post('/purchase', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, theme, recipient, sender, message, deliveryMethod, scheduledDeliveryDate } = req.body;
    const numAmount = Math.max(100, Math.round(Number(amount) || 0));

    if (!recipient?.email || !recipient?.name) {
      throw ApiError.badRequest('Recipient name and email address are required.');
    }
    if (!sender?.name || !sender?.email) {
      throw ApiError.badRequest('Sender name and email address are required.');
    }

    const paiseAmount = numAmount * 100;
    const receipt = `gc_rcpt_${Date.now()}`;

    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      try {
        const order = await razorpay.orders.create({
          amount: paiseAmount,
          currency: 'INR',
          receipt,
          notes: {
            type: 'gift_card_purchase',
            theme: theme || 'classic',
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            senderEmail: sender.email,
            senderName: sender.name,
          },
        });

        return res.status(200).json({
          success: true,
          order: {
            ...(typeof order === 'object' ? order : {}),
            key: env.RAZORPAY_KEY_ID,
            isMock: false,
          },
          cardDetails: {
            amount: numAmount,
            theme: theme || 'classic',
            recipient,
            sender,
            message,
            deliveryMethod: deliveryMethod || 'email',
            scheduledDeliveryDate,
          },
        });
      } catch (rzpErr: any) {
        logger.warn('Razorpay gift card order creation failed:', rzpErr?.message);
        if (env.isProd) throw rzpErr;
      }
    }

    // Offline dev environment simulated order
    return res.status(200).json({
      success: true,
      order: {
        id: `order_gc_mock_${Date.now()}`,
        amount: paiseAmount,
        currency: 'INR',
        receipt,
        status: 'created',
        key: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        isMock: true,
      },
      cardDetails: {
        amount: numAmount,
        theme: theme || 'classic',
        recipient,
        sender,
        message,
        deliveryMethod: deliveryMethod || 'email',
        scheduledDeliveryDate,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/gift-cards/verify-purchase
 * Finalizes purchase after Razorpay signature verification and issues the card
 */
router.post('/verify-purchase', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cardDetails,
    } = req.body;

    if (!cardDetails) {
      throw ApiError.badRequest('Missing gift card configuration details.');
    }

    // Verify payment signature if production payment
    if (env.isProd && env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      if (!razorpay_order_id || !razorpay_payment_id) {
        throw ApiError.badRequest('razorpay_order_id and razorpay_payment_id are required.');
      }

      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${String(razorpay_order_id)}|${String(razorpay_payment_id)}`)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const receivedBuf = Buffer.from(String(razorpay_signature), 'utf8');
      const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

      if (!isValid) {
        throw ApiError.badRequest('Invalid Razorpay payment signature.');
      }
    }

    const card = await GiftCardService.purchaseGiftCard({
      initialAmount: Number(cardDetails.amount),
      theme: cardDetails.theme || 'classic',
      recipient: cardDetails.recipient,
      sender: cardDetails.sender,
      message: cardDetails.message,
      deliveryMethod: cardDetails.deliveryMethod || 'email',
      scheduledDeliveryDate: cardDetails.scheduledDeliveryDate,
      purchaserOrderId: razorpay_payment_id || `sim_${Date.now()}`,
      issuedBy: 'storefront_purchase',
    });

    res.status(201).json({
      success: true,
      message: 'Gift card successfully issued and dispatched!',
      card: {
        id: card.id,
        code: card.code,
        pin: card.pin,
        initialAmount: card.initialAmount,
        currentBalance: card.currentBalance,
        theme: card.theme,
        recipient: card.recipient,
        sender: card.sender,
        expiresAt: card.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/gift-cards/verify/:code
 * Public balance verification endpoint with optional PIN check
 */
router.get('/verify/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = String(req.params.code || '');
    const pin = typeof req.query.pin === 'string' ? req.query.pin : undefined;

    const result = await GiftCardService.verifyGiftCard(code, pin);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/gift-cards/claim
 * Authenticated customer claims a gift card balance into their personal wallet
 */
router.post('/claim', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, pin } = req.body;
    if (!code) {
      throw ApiError.badRequest('Gift card code is required.');
    }

    const userId = (req as any).user?.id || (req as any).user?._id;
    const result = await StoreCreditService.claimGiftCard(userId, String(code), String(pin || ''));

    res.status(200).json({
      success: true,
      message: `Successfully claimed ₹${result.claimedAmount} to your account wallet!`,
      claimedAmount: result.claimedAmount,
      newBalance: result.newBalance,
      code: result.giftCardCode,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/gift-cards/metrics
 * Admin KPI metrics for gift card float and sales
 */
router.get('/metrics', authenticate, adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await GiftCardRepository.getMetrics();
    res.status(200).json({
      success: true,
      metrics,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/gift-cards
 * Admin list all cards with search, filters, pagination
 */
router.get('/', authenticate, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await GiftCardRepository.list({
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/gift-cards/admin/issue
 * Admin direct issuance (promotional or courtesy compensation)
 */
router.post('/admin/issue', authenticate, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { initialAmount, theme, recipient, sender, message, notes, customCode } = req.body;

    const card = await GiftCardRepository.create({
      initialAmount: Number(initialAmount),
      theme: theme || 'classic',
      recipient: recipient || { name: 'Valued Customer', email: 'guest@perfectpic.in' },
      sender: sender || { name: 'PerfectPic Concierge', email: 'concierge@perfectpic.in' },
      message: message || 'A gift from PerfectPic Concierge.',
      notes: notes || 'Admin issued courtesy voucher',
      issuedBy: 'admin_courtesy',
      customCode,
    });

    // Send email to recipient
    GiftCardService.sendGiftCardDelivery(card).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Gift card successfully issued.',
      card,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/gift-cards/admin/:id/status
 * Admin freeze, cancel, or re-activate card
 */
router.patch('/admin/:id/status', authenticate, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id || '');
    const { status, notes } = req.body;

    const updated = await GiftCardRepository.updateStatus(id, status, notes);
    if (!updated) {
      throw ApiError.notFound('Gift card not found.');
    }

    res.status(200).json({
      success: true,
      message: `Gift card status updated to ${status}.`,
      card: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/gift-cards/admin/:id/resend
 * Admin resend digital voucher to recipient
 */
router.post('/admin/:id/resend', authenticate, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id || '');
    const card = await GiftCardRepository.findById(id);
    if (!card) {
      throw ApiError.notFound('Gift card not found.');
    }

    await GiftCardService.sendGiftCardDelivery(card);

    res.status(200).json({
      success: true,
      message: `Digital gift voucher resent to ${card.recipient.email}.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
