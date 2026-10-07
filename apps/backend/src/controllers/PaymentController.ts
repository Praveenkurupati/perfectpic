// apps/backend/src/controllers/PaymentController.ts
import { Request, Response, NextFunction } from 'express';
import razorpay from '../lib/razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { PromoCodeService } from '../services/PromoCodeService';
import { acquireLock } from '../cache/redis';
import { OrderRepository } from '../repositories/OrderRepository';
import { mailService } from '../services/MailService';

export class PaymentController {
  public static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const rawAmount = Number(req.body.amount);
      if (isNaN(rawAmount) || rawAmount <= 0) {
        throw ApiError.badRequest('A valid positive order amount is required.');
      }

      // Safeguard: photobook orders and accessories must meet a minimum charge (₹99)
      if (rawAmount < 99) {
        throw ApiError.badRequest('Order amount does not meet the minimum checkout threshold.');
      }

      const paiseAmount = Math.round(rawAmount * 100); // Razorpay requires paise
      const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const options = {
        amount: paiseAmount,
        currency: 'INR',
        receipt: receiptId,
      };

      if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
        try {
          const order = await razorpay.orders.create(options);
          return res.status(200).json({
            ...(typeof order === 'object' ? order : {}),
            key: env.RAZORPAY_KEY_ID,
            isMock: false,
          });
        } catch (rzpErr: any) {
          logger.warn('Razorpay order creation call failed:', rzpErr?.message || rzpErr);
          if (env.isProd) {
            throw rzpErr;
          }
        }
      }

      // Disallow mock payment creation in production
      if (env.isProd) {
        throw ApiError.internal('Payment gateway is not properly configured on this server.');
      }

      // Offline dev environment simulated order
      logger.warn('⚠️ Razorpay keys missing: Creating simulated mock payment order for local development.');
      return res.status(200).json({
        id: `order_mock_${Date.now()}`,
        amount: options.amount,
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
        key: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        isMock: true,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderNumber } = req.body;

      // In production, payment signature and credentials are strictly mandatory
      if (env.isProd) {
        if (!env.RAZORPAY_KEY_SECRET) {
          throw ApiError.internal('Payment gateway secret is missing in server environment.');
        }
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          throw ApiError.badRequest('Missing required payment verification parameters.');
        }
      }

      if (env.RAZORPAY_KEY_SECRET && razorpay_signature) {
        if (!razorpay_order_id || !razorpay_payment_id) {
          throw ApiError.badRequest('razorpay_order_id and razorpay_payment_id are required.');
        }

        const expectedSignature = crypto
          .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
          .update(`${String(razorpay_order_id)}|${String(razorpay_payment_id)}`)
          .digest('hex');

        // Timing-safe comparison to prevent side-channel timing attacks
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const receivedBuf = Buffer.from(String(razorpay_signature), 'utf8');
        const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

        if (!isValid) {
          throw ApiError.badRequest('Invalid payment signature. Verification failed.');
        }

        // If an orderNumber was provided, update order payment status in repository
        if (orderNumber) {
          try {
            const updated = await OrderRepository.updateStatus(orderNumber, 'paid', {
              notes: `Verified via client confirmation. Payment ID: ${razorpay_payment_id}`,
            });

            if (updated && (updated as any).customerEmail) {
              mailService.sendOrderConfirmationEmail((updated as any).customerEmail, updated).catch((err: any) => {
                logger.error('[Verify] Failed to send order confirmation email:', err.message);
              });
            }
          } catch (orderUpdateErr: any) {
            logger.warn(`Could not update order ${orderNumber} status to paid:`, orderUpdateErr?.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
        });
      }

      // Offline dev mode fallback only
      if (!env.isProd) {
        logger.info('💡 Local dev: Simulated payment verified without active Razorpay secret.');
        if (orderNumber) {
          try {
            await OrderRepository.updateStatus(orderNumber, 'paid', {
              notes: `Simulated development payment verified.`,
            });
          } catch {}
        }
        return res.status(200).json({
          success: true,
          message: 'Mock payment verified successfully (development mode)',
        });
      }

      throw ApiError.badRequest('Payment verification failed.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Enterprise Razorpay Webhook Handler
   * - Bit-for-bit HMAC SHA-256 signature verification via rawBody buffer
   * - Distributed atomic idempotency lock via Redis SET NX EX 300
   * - Atomic Order status transition to 'paid'
   * - Automatic order confirmation email dispatch
   */
  public static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET;

      if (webhookSecret && webhookSignature) {
        // Use rawBody buffer if captured by express.json verify callback, fallback to stringified body
        const payloadBytes = req.rawBody
          ? req.rawBody
          : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(payloadBytes)
          .digest('hex');

        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const receivedBuf = Buffer.from(webhookSignature, 'utf8');
        const isValid =
          expectedBuf.length === receivedBuf.length &&
          crypto.timingSafeEqual(expectedBuf, receivedBuf);

        if (!isValid) {
          logger.warn('⚠️ Razorpay webhook signature verification mismatch.');
          throw ApiError.badRequest('Invalid webhook signature.');
        }
      }

      // 1. Atomic Distributed Idempotency Lock
      const eventId =
        (req.headers['x-razorpay-event-id'] as string) ||
        req.body?.event_id ||
        req.body?.payload?.payment?.entity?.id ||
        `evt_${Date.now()}`;

      const lockKey = `lock:webhook:${eventId}`;
      const acquired = await acquireLock(lockKey, 300); // 5-minute atomic lock

      if (!acquired) {
        logger.info(`[Razorpay Webhook] Duplicate delivery for event ${eventId}. Acknowledging HTTP 200.`);
        return res.status(200).json({ status: 'already_processed', eventId });
      }

      // 2. Process Webhook Event Types
      const eventName = req.body?.event;
      const payloadData = req.body?.payload;

      logger.info(`[Razorpay Webhook] Processing event: ${eventName} (Event ID: ${eventId})`);

      if (eventName === 'order.paid' || eventName === 'payment.captured') {
        const paymentEntity = payloadData?.payment?.entity;
        const orderEntity = payloadData?.order?.entity;
        const paymentId = paymentEntity?.id;
        const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
        const receipt = orderEntity?.receipt || paymentEntity?.notes?.orderNumber;

        logger.info(`[Razorpay Webhook] Payment captured: ${paymentId} for Order: ${rzpOrderId || receipt}`);

        let targetOrder: any = null;
        if (receipt) {
          targetOrder = await OrderRepository.findById(receipt);
        }
        if (!targetOrder && rzpOrderId) {
          const { orders } = await OrderRepository.findAll({ search: rzpOrderId, limit: 1 });
          if (orders && orders.length > 0) targetOrder = orders[0];
        }

        if (targetOrder) {
          const orderNum = targetOrder.orderNumber || targetOrder.id || targetOrder._id;
          await OrderRepository.updateStatus(orderNum, 'paid', {
            notes: `Captured via Razorpay webhook. Payment ID: ${paymentId}`,
          });

          if (targetOrder.customerEmail) {
            mailService.sendOrderConfirmationEmail(targetOrder.customerEmail, targetOrder).catch((err: any) => {
              logger.error('[Webhook] Failed to send order confirmation email:', err.message);
            });
          }
        }
      } else if (eventName === 'payment.failed') {
        const paymentEntity = payloadData?.payment?.entity;
        const rzpOrderId = paymentEntity?.order_id;
        logger.warn(`[Razorpay Webhook] Payment failed for Razorpay Order ${rzpOrderId}: ${paymentEntity?.error_description}`);
      }

      return res.status(200).json({ status: 'ok', eventId, processed: true });
    } catch (err) {
      next(err);
    }
  }

  public static async applyPromo(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, amount, customerEmail, customerPhone } = req.body;
      const subtotal = Number(amount) || 0;

      if (!code) {
        return res.status(200).json({ discount: 0, finalAmount: subtotal });
      }

      const result = await PromoCodeService.validatePromo({
        code,
        subtotal,
        customerEmail,
        customerPhone,
        userId: req.user?.id,
      });

      return res.status(200).json({
        discount: result.discountAmount,
        finalAmount: Math.max(0, subtotal - result.discountAmount),
        promo: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default PaymentController;
