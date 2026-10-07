// apps/backend/src/controllers/CustomerController.ts
import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/CustomerService';

export class CustomerController {
  public static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await CustomerService.getCustomers(search, page, limit);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default CustomerController;
