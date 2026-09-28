// apps/backend/src/services/OrderService.ts
import { OrderRepository } from '../repositories/OrderRepository';
import { ApiError } from '../utils/apiError';
import { mailService } from './MailService';
import { logger } from '../utils/logger';

export class OrderService {
  public static async getOrders(filter: { status?: string; search?: string; limit?: number; skip?: number }) {
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
      throw ApiError.badRequest('Order title is required.');
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
    return updated;
  }

  public static async getDashboardStats() {
    return await OrderRepository.getDashboardStats();
  }
}

export default OrderService;
