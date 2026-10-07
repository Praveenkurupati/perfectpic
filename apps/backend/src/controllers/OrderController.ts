// apps/backend/src/controllers/OrderController.ts
import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { PdfService } from '../services/PdfService';
import { ApiError } from '../utils/apiError';

export class OrderController {
  public static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, limit, skip, page, customerEmail } = req.query;
      const user = req.user;

      let emailFilter = typeof customerEmail === 'string' ? customerEmail : undefined;
      // If customer is authenticated and not admin, restrict view strictly to their own orders
      if (user && user.role !== 'admin' && user.email) {
        emailFilter = user.email;
      } else if (!user) {
        // Unauthenticated guests must provide their specific email to look up their orders
        if (!emailFilter) {
          throw ApiError.unauthorized('Authentication required to view orders.');
        }
      }

      const result = await OrderService.getOrders({
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
        customerEmail: emailFilter,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
      });
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const order = await OrderService.getOrderById(id);
      const user = (req as any).user;

      // Ownership authorization check (IDOR protection):
      // 1. Admin can access any order
      // 2. Authenticated user can access their own orders
      // 3. Guest can access if order was created as guest and verified email parameter is provided
      if (user) {
        if (user.role !== 'admin') {
          const userEmail = (user.email || '').toLowerCase().trim();
          const orderEmail = (
            (order as any).customerEmail ||
            (order as any).shippingAddress?.email ||
            ''
          ).toLowerCase().trim();
          const orderUserId = String((order as any).userId || '');
          const currentUserId = String(user.id || user._id || '');

          if (userEmail !== orderEmail && (!orderUserId || orderUserId !== currentUserId)) {
            throw ApiError.forbidden('You do not have permission to view this order.');
          }
        }
      } else {
        const queryEmail = String(req.query.email || '').toLowerCase().trim();
        const queryPhone = String(req.query.phone || '').replace(/\D/g, '');
        const guestToken = String(req.headers['x-guest-token'] || req.query.token || '').trim();
        const orderEmail = (
          (order as any).customerEmail ||
          (order as any).shippingAddress?.email ||
          ''
        ).toLowerCase().trim();
        const orderPhone = String((order as any).customerPhone || (order as any).shippingAddress?.phone || '').replace(/\D/g, '');
        const orderToken = String((order as any).guestToken || '').trim();

        const isTokenMatch = Boolean(guestToken && orderToken && guestToken === orderToken);
        const isEmailAndPhoneMatch = Boolean(
          queryEmail && orderEmail && queryEmail === orderEmail &&
          queryPhone && orderPhone && (queryPhone === orderPhone || orderPhone.endsWith(queryPhone))
        );

        if (!isTokenMatch && !isEmailAndPhoneMatch) {
          throw ApiError.unauthorized('Authentication, verified guest token, or matching customer credentials required to view order.');
        }
      }

      return res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  public static async downloadOrderPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const order = await OrderService.getOrderById(id);
      const user = (req as any).user;

      // Ownership authorization check (IDOR protection):
      if (user) {
        if (user.role !== 'admin') {
          const userEmail = (user.email || '').toLowerCase().trim();
          const orderEmail = (
            (order as any).customerEmail ||
            (order as any).shippingAddress?.email ||
            ''
          ).toLowerCase().trim();
          const orderUserId = String((order as any).userId || '');
          const currentUserId = String(user.id || user._id || '');

          if (userEmail !== orderEmail && (!orderUserId || orderUserId !== currentUserId)) {
            throw ApiError.forbidden('You do not have permission to download this order document.');
          }
        }
      } else {
        const queryEmail = String(req.query.email || '').toLowerCase().trim();
        const queryPhone = String(req.query.phone || '').replace(/\D/g, '');
        const guestToken = String(req.headers['x-guest-token'] || req.query.token || '').trim();
        const orderEmail = (
          (order as any).customerEmail ||
          (order as any).shippingAddress?.email ||
          ''
        ).toLowerCase().trim();
        const orderPhone = String((order as any).customerPhone || (order as any).shippingAddress?.phone || '').replace(/\D/g, '');
        const orderToken = String((order as any).guestToken || '').trim();

        const isTokenMatch = Boolean(guestToken && orderToken && guestToken === orderToken);
        const isEmailAndPhoneMatch = Boolean(
          queryEmail && orderEmail && queryEmail === orderEmail &&
          queryPhone && orderPhone && (queryPhone === orderPhone || orderPhone.endsWith(queryPhone))
        );

        if (!isTokenMatch && !isEmailAndPhoneMatch) {
          throw ApiError.unauthorized('Authentication, verified guest token, or matching customer credentials required to download order document.');
        }
      }

      // If the order has an S3 print-ready photobook PDF URL, redirect directly to it
      if (order && (order as any).pdfUrl) {
        return res.redirect((order as any).pdfUrl);
      }

      const pdfBuffer = await PdfService.generateOrderPdfBuffer(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="PerfectPic-Order-${id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.status(200).send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  public static async updateOrderPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { pdfUrl } = req.body;
      const updated = await OrderService.updatePdfUrl(id, pdfUrl);
      return res.status(200).json({
        message: 'Order PDF updated successfully',
        order: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.createOrder(req.body);
      return res.status(201).json({
        message: 'Order created successfully',
        id: (order as any).orderNumber || (order as any).id,
        orderNumber: (order as any).orderNumber || (order as any).id,
        guestToken: (order as any).guestToken,
        order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { status, notes, tracking, carrier, trackingNumber, trackingUrl, updatedBy } = req.body;
      const updated = await OrderService.updateOrderStatus(id, status, {
        notes,
        tracking,
        carrier,
        trackingNumber,
        trackingUrl,
        updatedBy,
      });
      return res.status(200).json({
        message: `Order status updated to '${status}' successfully`,
        order: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await OrderService.getDashboardStats();
      return res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }

  public static async submitOrderReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const review = await OrderService.submitReview(id, req.body);
      return res.status(200).json({
        message: 'Review submitted successfully',
        review,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getOrderReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const review = await OrderService.getOrderReview(id);
      return res.status(200).json({ review });
    } catch (err) {
      next(err);
    }
  }
}

export default OrderController;
