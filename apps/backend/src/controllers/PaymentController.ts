// apps/backend/src/controllers/PaymentController.ts
import { Request, Response, NextFunction } from 'express';
import razorpay from '../lib/razorpay';
import crypto from 'crypto';
import { env } from '../config/env';

export class PaymentController {
  public static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;
      const options = {
        amount: Math.round((Number(amount) || 1999) * 100), // in paise
        currency: 'INR',
        receipt: 'rcpt_' + Date.now(),
      };

      if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
        const order = await razorpay.orders.create(options);
        return res.status(200).json({
          ...(typeof order === 'object' ? order : {}),
          key: env.RAZORPAY_KEY_ID,
          isMock: false,
        });
      }

      // Simulated mock payment order
      return res.status(200).json({
        id: 'order_mock_' + Date.now(),
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

  public static async verify(req: Request, res: Response) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        return res.status(200).json({ success: true, message: 'Payment verified successfully' });
      }
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    return res.status(200).json({ success: true, message: 'Mock payment verified successfully' });
  }

  public static async webhook(req: Request, res: Response) {
    return res.status(200).send('OK');
  }

  public static async applyPromo(req: Request, res: Response) {
    const amount = Number(req.body.amount) || 1999;
    return res.status(200).json({ discount: 0, finalAmount: amount });
  }
}

export default PaymentController;
