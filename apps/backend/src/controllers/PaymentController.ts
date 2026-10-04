// apps/backend/src/controllers/PaymentController.ts
import { Request, Response, NextFunction } from 'express';
import razorpay from '../lib/razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { PromoCodeService } from '../services/PromoCodeService';

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
        const order = await razorpay.orders.create(options);
        return res.status(200).json({
          ...(typeof order === 'object' ? order : {}),
          key: env.RAZORPAY_KEY_ID,
          isMock: false,
        });
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
            const { OrderRepository } = await import('../repositories/OrderRepository');
            await OrderRepository.updateStatus(orderNumber, 'paid');
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

  public static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET;

      if (webhookSecret && webhookSignature) {
        const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(bodyStr)
          .digest('hex');

        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const receivedBuf = Buffer.from(webhookSignature, 'utf8');
        const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

        if (!isValid) {
          throw ApiError.badRequest('Invalid webhook signature.');
        }
      }

      return res.status(200).json({ status: 'ok' });
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
