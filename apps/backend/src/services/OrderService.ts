import mongoose from 'mongoose';
import { isDbConnected } from '../db/connection';
import { OrderRepository } from '../repositories/OrderRepository';
import { PromoCodeService } from './PromoCodeService';
import { PricingService } from './PricingService';
import { ApiError } from '../utils/apiError';
import { mailService } from './MailService';
import { MetaCapiService } from './MetaCapiService';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { printRenderQueue } from '../queues/QueueManager';

export class OrderService {
  public static async getOrders(filter: { status?: string; search?: string; customerEmail?: string; limit?: number; skip?: number; page?: number }) {
    return await OrderRepository.findAll(filter);
  }

  public static async getOrderById(id: string) {
    const order = await OrderRepository.findById(id);
    if (!order) {
      throw ApiError.notFound(`Order with ID '${id}' not found.`);
    }
    return order;
  }

  public static async createOrder(orderData: any) {
    // In production, block all simulated or mock payment orders (PAY-01 enforcement)
    if (env.isProd) {
      const paymentDetails = orderData.paymentDetails || orderData.pricing;
      const isMockPayment =
        orderData.payment?.isMock ||
        orderData.paymentId === 'mock' ||
        paymentDetails?.paymentMethod === 'mock' ||
        String(orderData.paymentDetails?.razorpayPaymentId || '').startsWith('pay_sim_') ||
        String(orderData.paymentDetails?.razorpaySignature || '') === 'mock_signature';

      if (isMockPayment) {
        throw ApiError.forbidden(
          'Simulated mock payments cannot be used to place orders in production.'
        );
      }
    }

    // 1. Authoritative Server-Side Pricing Verification
    if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
      const authoritativePricing = await PricingService.calculateOrderPrice({
        items: orderData.items,
        accessories: orderData.accessories || orderData.packaging,
        promoCode: orderData.promoCode || orderData.pricing?.promoCode,
        deliveryOption:
          orderData.deliveryOption ||
          (orderData.pricing?.shipping === 299 ? 'express' : 'standard'),
        customerEmail: orderData.customerEmail || orderData.shippingAddress?.email,
        customerPhone: orderData.customerPhone || orderData.shippingAddress?.phone,
        userId: orderData.userId,
        claimedTotal:
          orderData.total !== undefined
            ? Number(orderData.total)
            : orderData.amount !== undefined
            ? Number(orderData.amount)
            : undefined,
      });

      // Lock authoritative amounts to prevent client-side price tampering
      orderData.total = authoritativePricing.finalTotal;
      orderData.amount = authoritativePricing.finalTotal;
      orderData.subtotal = authoritativePricing.subtotal;
      orderData.discount = authoritativePricing.totalDiscount;
      orderData.pricing = {
        subtotal: authoritativePricing.subtotal,
        promoCode: authoritativePricing.promoCode,
        discount: authoritativePricing.promoDiscount,
        bundleDiscount: authoritativePricing.bundleDiscount,
        bundleTier: authoritativePricing.bundleTier,
        shipping: authoritativePricing.shippingFee,
        packagingPrice: authoritativePricing.accessoriesSubtotal,
        packagingAddon: authoritativePricing.accessoriesSubtotal > 0,
        total: authoritativePricing.finalTotal,
        paymentMethod: orderData.pricing?.paymentMethod || 'prepaid',
        advancePaid: authoritativePricing.finalTotal,
        balanceDue: 0,
      };

      // Map enriched authoritative items back
      orderData.items = orderData.items.map((item: any, idx: number) => {
        const calculated = authoritativePricing.items[idx];
        return {
          ...item,
          price: calculated ? calculated.unitPrice : item.price,
          unitBasePrice: calculated ? calculated.unitBasePrice : item.unitBasePrice,
          coverAdjustment: calculated ? calculated.coverAdjustment : 0,
          pageAdjustment: calculated ? calculated.pageAdjustment : 0,
        };
      });
    }

    if (!orderData.title) {
      if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
        const first = orderData.items[0];
        orderData.title = orderData.items.length > 1
          ? `${first.title || 'Photobook'} (+${orderData.items.length - 1} more)`
          : (first.title || 'Custom Photobook Keepsake');
      } else {
        orderData.title = 'Custom Photobook Keepsake';
      }
    }

    const promoCode = orderData.pricing?.promoCode || orderData.promoCode;
    const discountAmount = orderData.pricing?.discount || orderData.discount || 0;

    let order: any;

    if (isDbConnected()) {
      let session: mongoose.ClientSession | null = null;
      try {
        session = await mongoose.startSession();
        // Check if MongoDB replica set / Atlas cluster supports multi-document transactions
        const clientTopology = ((mongoose.connection as any)?.client)?.topology?.description?.type;
        const isReplicaSet = clientTopology && clientTopology !== 'Single';

        if (isReplicaSet) {
          await session.withTransaction(async () => {
            order = await OrderRepository.create(orderData, { session: session! });
            if (promoCode && order) {
              await PromoCodeService.recordOrderPromoUsage({
                code: promoCode,
                orderId: order.id || (order as any)._id,
                orderNumber: order.orderNumber,
                customerEmail: orderData.customerEmail || orderData.shippingAddress?.email || 'guest@perfectpic.in',
                customerPhone: orderData.customerPhone || orderData.shippingAddress?.phone,
                userId: orderData.userId,
                discountAmount: Number(discountAmount),
                orderTotal: Number(order.total || order.amount || 0),
              }, { session: session! });
            }
          });
        } else {
          // Standalone dev MongoDB fallback
          order = await OrderRepository.create(orderData);
          if (promoCode && order) {
            await PromoCodeService.recordOrderPromoUsage({
              code: promoCode,
              orderId: order.id || (order as any)._id,
              orderNumber: order.orderNumber,
              customerEmail: orderData.customerEmail || orderData.shippingAddress?.email || 'guest@perfectpic.in',
              customerPhone: orderData.customerPhone || orderData.shippingAddress?.phone,
              userId: orderData.userId,
              discountAmount: Number(discountAmount),
              orderTotal: Number(order.total || order.amount || 0),
            });
          }
        }
      } catch (txnError: any) {
        logger.error('[MongoDB Transaction Error] Order creation aborted:', txnError.message);
        throw ApiError.internal(`Failed to process order transaction: ${txnError.message}`);
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    } else {
      // In-memory fallback
      order = await OrderRepository.create(orderData);
      if (promoCode && order) {
        await PromoCodeService.recordOrderPromoUsage({
          code: promoCode,
          orderId: order.id || (order as any)._id,
          orderNumber: order.orderNumber,
          customerEmail: orderData.customerEmail || orderData.shippingAddress?.email || 'guest@perfectpic.in',
          customerPhone: orderData.customerPhone || orderData.shippingAddress?.phone,
          userId: orderData.userId,
          discountAmount: Number(discountAmount),
          orderTotal: Number(order.total || order.amount || 0),
        });
      }
    }

    // Send confirmation email asynchronously if customer email exists
    if (orderData.customerEmail) {
      mailService.sendOrderConfirmationEmail(orderData.customerEmail, order).catch((err) => {
        logger.error('Failed to send order confirmation email:', err.message);
      });
    }

    // Trigger Meta Conversions API (CAPI) server-side Purchase event
    const customerEmail = orderData.customerEmail || orderData.shippingAddress?.email;
    const customerPhone = orderData.customerPhone || orderData.shippingAddress?.phone;
    const orderTotal = Number(order.total || order.amount || 0);
    const orderId = String(order.id || (order as any)._id || order.orderNumber);

    MetaCapiService.sendEvent({
      eventName: 'Purchase',
      eventId: `order_${orderId}`,
      actionSource: 'website',
      eventSourceUrl: 'https://perfectpic.in/checkout',
      userData: {
        email: customerEmail,
        phone: customerPhone,
        firstName: orderData.shippingAddress?.fullName?.split(' ')[0] || orderData.customerName?.split(' ')[0],
        lastName: orderData.shippingAddress?.fullName?.split(' ').slice(1).join(' ') || orderData.customerName?.split(' ').slice(1).join(' '),
        city: orderData.shippingAddress?.city,
        state: orderData.shippingAddress?.state,
        zip: orderData.shippingAddress?.postalCode || orderData.shippingAddress?.pincode,
        country: 'in',
        fbp: orderData.tracking?.fbp,
        fbc: orderData.tracking?.fbc,
      },
      customData: {
        currency: 'INR',
        value: orderTotal,
        order_id: order.orderNumber || orderId,
        num_items: Array.isArray(orderData.items) ? orderData.items.length : 1,
        contents: Array.isArray(orderData.items)
          ? orderData.items.map((it: any) => ({
              id: it.templateId || it.id || 'photobook',
              quantity: it.quantity || 1,
              item_price: it.price || orderTotal,
              title: it.title || 'Custom Photobook Keepsake',
            }))
          : [{ id: 'photobook', quantity: 1, item_price: orderTotal, title: order.title }],
      },
    }).catch((err) => {
      logger.error('[Meta CAPI Order Purchase Error]:', err.message);
    });

    // Enqueue print-ready PDF compilation in background worker queue
    const orderNumber = String(order.orderNumber || order.id || (order as any)._id);
    const correlationId = orderData.correlationId || `cid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    printRenderQueue.add('compile-print-pdf', {
      orderId: orderNumber,
      projectId: orderData.projectId || (orderData.items && orderData.items[0]?.projectId),
      customerEmail: customerEmail,
      correlationId,
      options: {
        projectManifest: orderData.projectManifest || (orderData.items && orderData.items[0]?.projectSnapshot),
      },
    }).catch((qErr: any) => {
      logger.warn(`Could not enqueue print render job for ${orderNumber}:`, qErr?.message);
    });

    return order;
  }

  public static async updateOrderStatus(
    id: string, 
    status: string,
    options?: {
      notes?: string;
      tracking?: any;
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      updatedBy?: string;
    }
  ) {
    if (!status) {
      throw ApiError.badRequest('New status is required.');
    }

    const trackingPayload = options?.tracking || (options?.trackingNumber ? {
      carrier: options.carrier || 'BlueDart Express',
      trackingNumber: options.trackingNumber,
      trackingUrl: options.trackingUrl || `https://www.bluedart.com/tracking?awb=${options.trackingNumber}`,
    } : undefined);

    const updated = await OrderRepository.updateStatus(id, status, {
      notes: options?.notes,
      tracking: trackingPayload,
      updatedBy: options?.updatedBy,
    });

    if (!updated) {
      throw ApiError.notFound(`Order with ID '${id}' not found.`);
    }

    // Trigger dispatch notification email when transitioned to dispatched
    if (status.toLowerCase() === 'dispatched' && (updated as any).customerEmail) {
      const trackingNumber = trackingPayload?.trackingNumber || `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`;
      mailService.sendDispatchEmail((updated as any).customerEmail, updated, {
        carrier: trackingPayload?.carrier || 'BlueDart Express',
        trackingNumber,
        trackingUrl: trackingPayload?.trackingUrl || `https://www.bluedart.com/tracking?awb=${trackingNumber}`,
      }).catch((err) => {
        logger.error('Failed to send dispatch email:', err.message);
      });
    }

    return updated;
  }

  public static async updatePdfUrl(id: string, pdfUrl: string) {
    if (!pdfUrl) {
      throw ApiError.badRequest('PDF URL is required.');
    }
    const updated = await OrderRepository.updatePdfUrl(id, pdfUrl);
    if (!updated) {
      throw ApiError.notFound(`Order with ID '${id}' not found.`);
    }
    return updated;
  }

  public static async submitReview(id: string, reviewData: any) {
    if (!reviewData.rating) {
      throw ApiError.badRequest('Rating is required (1-5 stars).');
    }
    const payload = {
      ...reviewData,
      submittedAt: new Date().toISOString(),
    };
    const updated = await OrderRepository.updateReview(id, payload);
    if (!updated) {
      throw ApiError.notFound(`Order with ID '${id}' not found.`);
    }
    return payload;
  }

  public static async getOrderReview(id: string) {
    const order = await OrderRepository.findById(id);
    if (!order) {
      throw ApiError.notFound(`Order with ID '${id}' not found.`);
    }
    return (order as any).review || null;
  }

  public static async getDashboardStats() {
    return await OrderRepository.getDashboardStats();
  }
}

export default OrderService;
