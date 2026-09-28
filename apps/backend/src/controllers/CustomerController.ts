// apps/backend/src/controllers/CustomerController.ts
import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/CustomerService';

export class CustomerController {
  public static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const result = await CustomerService.getCustomers(search);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default CustomerController;
