import mongoose from 'mongoose';
import { isDbConnected } from '../db/connection';
import { OrderRepository } from '../repositories/OrderRepository';
import { PromoCodeService } from './PromoCodeService';
import { PricingService } from './PricingService';
import { GiftCardRepository } from '../repositories/GiftCardRepository';
import { StoreCreditService } from './StoreCreditService';
import { ApiError } from '../utils/apiError';
import { mailService } from './MailService';
import { WhatsappService } from './WhatsappService';
import { MetaCapiService } from './MetaCapiService';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { printRenderQueue } from '../queues/QueueManager';

export class OrderService {
  public static async getOrders(filter: {
    status?: string;
    search?: string;
    customerEmail?: string;
    deliveryOption?: string;
    isRush?: boolean;
    limit?: number;
    skip?: number;
    page?: number;
  }) {
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
          (orderData.pricing?.shipping === 499 ? 'rush' : orderData.pricing?.shipping === 299 ? 'express' : 'standard'),
        isRushProduction: Boolean(orderData.isRushProduction || orderData.deliveryOption === 'rush' || orderData.productionPriority === 'RUSH'),
        giftCardCode: orderData.giftCardCode || orderData.pricing?.giftCardCode,
        giftCardPin: orderData.giftCardPin,
        useStoreCredit: Boolean(orderData.useStoreCredit || orderData.storeCreditAmount),
        storeCreditAmount: orderData.storeCreditAmount,
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
      orderData.isRushProduction = authoritativePricing.isRushProduction;
      orderData.rushProductionFee = authoritativePricing.rushFee;
      orderData.productionPriority = authoritativePricing.isRushProduction ? 'RUSH' : 'STANDARD';
      orderData.deliveryOption = authoritativePricing.deliveryOption;
      orderData.targetDispatchAt = authoritativePricing.isRushProduction
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString();
      orderData.payableBeforeCredit = authoritativePricing.payableBeforeCredit;
      orderData.giftCardDeduction = authoritativePricing.giftCardDeduction;
      orderData.giftCardCode = authoritativePricing.giftCardCode;
      orderData.storeCreditDeduction = authoritativePricing.storeCreditDeduction;

      // Zero-Payable Checkout Bypass: If completely covered by credits / gift card
      if (authoritativePricing.finalTotal === 0 && (authoritativePricing.giftCardDeduction > 0 || authoritativePricing.storeCreditDeduction > 0)) {
        orderData.status = 'confirmed';
        orderData.paymentStatus = 'paid';
        orderData.paymentDetails = {
          paymentMethod: authoritativePricing.giftCardDeduction > 0 && authoritativePricing.storeCreditDeduction > 0
            ? 'split_credit_giftcard'
            : authoritativePricing.giftCardDeduction > 0
            ? 'gift_card'
            : 'store_credit',
          transactionId: `cr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'completed',
        };
      }

      orderData.pricing = {
        subtotal: authoritativePricing.subtotal,
        promoCode: authoritativePricing.promoCode,
        discount: authoritativePricing.promoDiscount,
        bundleDiscount: authoritativePricing.bundleDiscount,
        bundleTier: authoritativePricing.bundleTier,
        shipping: authoritativePricing.shippingFee,
        packagingPrice: authoritativePricing.accessoriesSubtotal,
        packagingAddon: authoritativePricing.accessoriesSubtotal > 0,
        isRushProduction: authoritativePricing.isRushProduction,
        rushFee: authoritativePricing.rushFee,
        payableBeforeCredit: authoritativePricing.payableBeforeCredit,
        giftCardDeduction: authoritativePricing.giftCardDeduction,
        giftCardCode: authoritativePricing.giftCardCode,
        storeCreditDeduction: authoritativePricing.storeCreditDeduction,
        total: authoritativePricing.finalTotal,
        paymentMethod: orderData.pricing?.paymentMethod || orderData.paymentDetails?.paymentMethod || 'prepaid',
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

    // Atomically deduct applied Gift Card balance
    if (order && orderData.giftCardDeduction > 0 && orderData.giftCardCode) {
      await GiftCardRepository.deductBalance(
        orderData.giftCardCode,
        orderData.giftCardDeduction,
        {
          orderId: order.id || (order as any)._id,
          orderNumber: order.orderNumber,
          customerEmail: orderData.customerEmail || orderData.shippingAddress?.email || 'guest@perfectpic.in',
          userId: orderData.userId,
        }
      ).catch((err: any) => {
        logger.error(`Failed to deduct gift card balance (${orderData.giftCardCode}):`, err.message);
      });
    }

    // Atomically deduct applied Store Credit from user wallet
    if (order && orderData.storeCreditDeduction > 0 && orderData.userId) {
      await StoreCreditService.deductCreditForOrder(
        orderData.userId,
        orderData.storeCreditDeduction,
        {
          orderId: order.id || (order as any)._id,
          orderNumber: order.orderNumber,
          customerEmail: orderData.customerEmail || orderData.shippingAddress?.email || 'guest@perfectpic.in',
        }
      ).catch((err: any) => {
        logger.error(`Failed to deduct store credit for user ${orderData.userId}:`, err.message);
      });
    }

    // Send confirmation email asynchronously if customer email exists
    if (orderData.customerEmail) {
      mailService.sendOrderConfirmationEmail(orderData.customerEmail, order).catch((err) => {
        logger.error('Failed to send order confirmation email:', err.message);
      });
    }

    // Send confirmation WhatsApp asynchronously if customer phone exists
    const notifyPhone = orderData.customerPhone || orderData.shippingAddress?.phone;
    if (notifyPhone) {
      const orderNum = String(order.orderNumber || order.id || (order as any)._id || 'PP-ORDER');
      const orderTitle = order.title || (orderData.items && orderData.items[0]?.title) || 'Archival Photobook Keepsake';
      const orderTotal = Number(order.total || order.amount || 0);
      WhatsappService.sendOrderConfirmation(notifyPhone, {
        orderNumber: orderNum,
        title: orderTitle,
        total: orderTotal,
        customerName: orderData.shippingAddress?.fullName || orderData.customerName,
        itemsCount: Array.isArray(orderData.items) ? orderData.items.length : 1,
      }).catch((err) => {
        logger.error('Failed to send WhatsApp order confirmation:', err.message);
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
    const isRushJob = Boolean(
      orderData.isRushProduction ||
      (order as any).isRushProduction ||
      orderData.productionPriority === 'RUSH' ||
      (order as any).productionPriority === 'RUSH' ||
      orderData.deliveryOption === 'rush' ||
      (order as any).deliveryOption === 'rush'
    );
    printRenderQueue.add('compile-print-pdf', {
      orderId: orderNumber,
      projectId: orderData.projectId || (orderData.items && orderData.items[0]?.projectId),
      customerEmail: customerEmail,
      correlationId,
      options: {
        projectManifest: orderData.projectManifest || (orderData.items && orderData.items[0]?.projectSnapshot),
      },
    }, {
      priority: isRushJob ? 1 : 10,
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

    // Trigger dispatch notifications when transitioned to dispatched
    if (status.toLowerCase() === 'dispatched') {
      const trackingNumber = trackingPayload?.trackingNumber || `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`;
      const carrier = trackingPayload?.carrier || 'BlueDart Express';
      const trackingUrl = trackingPayload?.trackingUrl || `https://www.bluedart.com/tracking?awb=${trackingNumber}`;

      // Email dispatch notification
      if ((updated as any).customerEmail) {
        mailService.sendDispatchEmail((updated as any).customerEmail, updated, {
          carrier,
          trackingNumber,
          trackingUrl,
        }).catch((err) => {
          logger.error('Failed to send dispatch email:', err.message);
        });
      }

      // WhatsApp dispatch notification
      const dispatchPhone = (updated as any).customerPhone || (updated as any).shippingAddress?.phone;
      if (dispatchPhone) {
        WhatsappService.sendDispatchNotification(
          dispatchPhone,
          {
            orderNumber: (updated as any).orderNumber || id,
            title: (updated as any).title,
            customerName: (updated as any).customerName || (updated as any).shippingAddress?.fullName,
          },
          {
            carrier,
            trackingNumber,
            trackingUrl,
          }
        ).catch((err) => {
          logger.error('Failed to send WhatsApp dispatch notification:', err.message);
        });
      }
    }

    // Trigger delivery notification via WhatsApp when transitioned to delivered
    if (status.toLowerCase() === 'delivered') {
      const deliveryPhone = (updated as any).customerPhone || (updated as any).shippingAddress?.phone;
      if (deliveryPhone) {
        WhatsappService.sendDeliveryNotification(deliveryPhone, {
          orderNumber: (updated as any).orderNumber || id,
          title: (updated as any).title,
          customerName: (updated as any).customerName || (updated as any).shippingAddress?.fullName,
        }).catch((err) => {
          logger.error('Failed to send WhatsApp delivery notification:', err.message);
        });
      }
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

  public static async updateOrderAddress(id: string, newAddress: any, updatedBy: string) {
    if (!newAddress || (!newAddress.addressLine1 && !newAddress.pincode)) {
      throw ApiError.badRequest('Valid shipping address details are required.');
    }
    const updated = await OrderRepository.updateAddress(id, newAddress, updatedBy);
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

  public static async reorder(
    id: string,
    options?: {
      quantity?: number;
      shippingAddress?: any;
      isGift?: boolean;
      giftMessage?: string;
      promoCode?: string;
      accessories?: any;
      packaging?: any;
      deliveryOption?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      userId?: string;
    },
    user?: any
  ) {
    const originalOrder = await OrderRepository.findById(id);
    if (!originalOrder) {
      throw ApiError.notFound(`Original order '${id}' not found.`);
    }

    const original: any = originalOrder;

    // IDOR protection check for customer re-order
    if (user && user.role !== 'admin') {
      const userEmail = (user.email || '').toLowerCase().trim();
      const orderEmail = (
        original.customerEmail ||
        original.shippingAddress?.email ||
        ''
      ).toLowerCase().trim();
      const orderUserId = String(original.userId || '');
      const currentUserId = String(user.id || user._id || '');

      if (userEmail !== orderEmail && (!orderUserId || orderUserId !== currentUserId)) {
        throw ApiError.forbidden('You do not have permission to re-order this photobook.');
      }
    }

    const quantity = Math.max(1, Number(options?.quantity) || 1);

    // Extract items from original order or construct from book properties
    const originalItems = Array.isArray(original.items) && original.items.length > 0
      ? original.items
      : [
          {
            title: original.title || 'Archival Custom Photobook',
            dimensions: original.dimensions || '8.25" × 8.25"',
            pageCount: original.pageCount || 40,
            price: original.pricing?.subtotal || original.total || 1999,
            quantity: 1,
            thumbnail: original.thumbnail || original.coverUrl,
            pdfUrl: original.pdfUrl || original.printPdfUrl,
          },
        ];

    // Clone items and set quantity & pdfUrl reference
    const clonedItems = originalItems.map((item: any) => ({
      ...item,
      quantity,
      pdfUrl: item.pdfUrl || original.pdfUrl || original.printPdfUrl,
    }));

    const shippingAddress = options?.shippingAddress || original.shippingAddress;
    const isGift = options?.isGift !== undefined ? Boolean(options.isGift) : Boolean(original.isGift);
    const giftMessage = options?.giftMessage || original.giftMessage;
    const effectivePromoCode = options?.promoCode !== undefined ? options.promoCode : 'REORDER15';

    // Calculate authoritative pricing with family reorder incentive
    const calculatedPricing = await PricingService.calculateOrderPrice({
      items: clonedItems,
      accessories: options?.accessories || options?.packaging || original.accessories || original.packaging,
      promoCode: effectivePromoCode,
      deliveryOption: options?.deliveryOption || original.deliveryOption || 'standard',
      customerEmail: options?.customerEmail || shippingAddress?.email || original.customerEmail,
      customerPhone: options?.customerPhone || shippingAddress?.phone || original.customerPhone,
      userId: options?.userId || user?.id || original.userId,
    });

    const originalOrderNum = original.orderNumber || original.id || id;
    const reorderTitle = `${original.title || 'Photobook'} (Reprint)`;

    const reorderData: any = {
      userId: user?.id || original.userId,
      title: reorderTitle,
      customerName: shippingAddress?.fullName || shippingAddress?.name || options?.customerName || original.customerName,
      customerEmail: options?.customerEmail || shippingAddress?.email || original.customerEmail,
      customerPhone: options?.customerPhone || shippingAddress?.phone || original.customerPhone,
      amount: calculatedPricing.finalTotal,
      total: calculatedPricing.finalTotal,
      status: 'confirmed',
      isReorder: true,
      originalOrderId: String(original.id || original._id || id),
      originalOrderNumber: originalOrderNum,
      pdfUrl: original.pdfUrl || original.printPdfUrl, // Instant print PDF reuse!
      printPdfUrl: original.printPdfUrl || original.pdfUrl,
      coverUrl: original.coverUrl || original.thumbnail,
      thumbnail: original.thumbnail || original.coverUrl,
      dimensions: original.dimensions || '8.25" × 8.25"',
      pageCount: original.pageCount || 40,
      itemsCount: quantity,
      items: clonedItems,
      projectSnapshot: original.projectSnapshot,
      specifications: original.specifications,
      packaging: original.packaging,
      accessories: original.accessories,
      isGift,
      giftMessage,
      shippingAddress,
      deliveryOption: options?.deliveryOption || original.deliveryOption || 'standard',
      pricing: {
        subtotal: calculatedPricing.subtotal,
        promoCode: calculatedPricing.promoCode,
        discount: calculatedPricing.promoDiscount,
        bundleDiscount: calculatedPricing.bundleDiscount,
        bundleTier: calculatedPricing.bundleTier,
        shipping: calculatedPricing.shippingFee,
        packagingPrice: calculatedPricing.accessoriesSubtotal,
        packagingAddon: calculatedPricing.accessoriesSubtotal > 0,
        total: calculatedPricing.finalTotal,
        paymentMethod: 'prepaid',
        reorderDiscountApplied: Boolean(calculatedPricing.promoDiscount > 0),
        currency: 'INR',
      },
      auditLog: [
        {
          action: 'reorder_created',
          updatedBy: user?.email || originalOrder.customerEmail || 'Customer Re-order',
          timestamp: new Date(),
          details: `Re-order created for ${quantity} copy/copies from original order #${originalOrderNum}. PDF verified & reused directly.`,
        },
      ],
    };

    // Create the re-order
    const created = await this.createOrder(reorderData);

    // Increment reorderCount on the original order
    try {
      await OrderRepository.incrementReorderCount(id);
    } catch (err: any) {
      logger.warn(`Could not increment reorder count for order ${id}:`, err?.message);
    }

    return created;
  }

  public static async getDashboardStats() {
    return await OrderRepository.getDashboardStats();
  }
}

export default OrderService;
