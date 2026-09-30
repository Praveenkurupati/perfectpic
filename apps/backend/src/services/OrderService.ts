// apps/backend/src/services/OrderService.ts
import { OrderRepository } from '../repositories/OrderRepository';
import { ApiError } from '../utils/apiError';
import { mailService } from './MailService';
import { logger } from '../utils/logger';

export class OrderService {
  public static async getOrders(filter: { status?: string; search?: string; customerEmail?: string; limit?: number; skip?: number }) {
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

    const order = await OrderRepository.create(orderData);

    // Send confirmation email asynchronously if customer email exists
    if (orderData.customerEmail) {
      mailService.sendOrderConfirmationEmail(orderData.customerEmail, order).catch((err) => {
        logger.error('Failed to send order confirmation email:', err.message);
      });
    }

    return order;
  }

  public static async updateOrderStatus(id: string, status: string) {
    if (!status) {
      throw ApiError.badRequest('New status is required.');
    }
    const updated = await OrderRepository.updateStatus(id, status);
    if (!updated) {
      throw ApiError.notFound(`Order with ID '${id}' not found.`);
    }

    // Trigger dispatch notification email when transitioned to dispatched
    if (status.toLowerCase() === 'dispatched' && (updated as any).customerEmail) {
      const trackingNumber = `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`;
      mailService.sendDispatchEmail((updated as any).customerEmail, updated, {
        carrier: 'BlueDart Express',
        trackingNumber,
        trackingUrl: `https://www.bluedart.com/tracking?awb=${trackingNumber}`,
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
