// apps/backend/src/controllers/OrderController.ts
import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { PdfService } from '../services/PdfService';

export class OrderController {
  public static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, limit, skip, customerEmail } = req.query;
      const user = req.user;

      let emailFilter = typeof customerEmail === 'string' ? customerEmail : undefined;
      // If customer is authenticated and not admin, restrict view strictly to their own orders
      if (user && user.role !== 'admin' && user.email) {
        emailFilter = user.email;
      }

      const result = await OrderService.getOrders({
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
        customerEmail: emailFilter,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
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
      return res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  public static async downloadOrderPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const pdfBuffer = await PdfService.generateOrderPdfBuffer(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="PerfectPic-Order-${id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.status(200).send(pdfBuffer);
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
        order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const updated = await OrderService.updateOrderStatus(id, status);
      return res.status(200).json({
        message: 'Order status updated successfully',
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
