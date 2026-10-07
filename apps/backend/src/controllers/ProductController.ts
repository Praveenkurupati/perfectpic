// apps/backend/src/controllers/ProductController.ts
import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
  public static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search, tag, limit, skip, page } = req.query;
      const result = await ProductService.getProducts({
        category: typeof category === 'string' ? category : undefined,
        search: typeof search === 'string' ? search : undefined,
        tag: typeof tag === 'string' ? tag : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
      });
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const product = await ProductService.getProductBySlugOrId(slug);
      return res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  public static async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getFeatured();
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getCategories(req: Request, res: Response) {
    const result = ProductService.getCategories();
    return res.status(200).json(result);
  }

  public static async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getConfig();
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await ProductService.createProduct(req.body);
      return res.status(201).json({
        message: 'Product created successfully',
        product: created,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const updated = await ProductService.updateProduct(id, req.body);
      return res.status(200).json({
        message: 'Product updated successfully',
        product: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await ProductService.deleteProduct(id);
      return res.status(200).json({
        message: 'Product deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default ProductController;
