// apps/backend/src/controllers/PageOptionController.ts
import { Request, Response, NextFunction } from 'express';
import { PageOptionService } from '../services/PageOptionService';

export class PageOptionController {
  /**
   * Public: List active page options for storefront and editor
   */
  public static async getActivePageOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await PageOptionService.getPageOptions(true);
      return res.status(200).json({ pageOptions: items, total: items.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: List all page options (active + inactive)
   */
  public static async getAllPageOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await PageOptionService.getPageOptions(false);
      return res.status(200).json({ pageOptions: items, total: items.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single page option by id/count
   */
  public static async getPageOptionById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const item = await PageOptionService.getPageOptionById(id);
      return res.status(200).json(item);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Create new page option
   */
  public static async createPageOption(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await PageOptionService.createPageOption(req.body);
      return res.status(201).json({
        message: 'Page option created successfully',
        pageOption: created,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Update page option
   */
  public static async updatePageOption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const updated = await PageOptionService.updatePageOption(id, req.body);
      return res.status(200).json({
        message: 'Page option updated successfully',
        pageOption: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Delete page option
   */
  public static async deletePageOption(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await PageOptionService.deletePageOption(id);
      return res.status(200).json({
        message: 'Page option removed successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Reset page options to standard defaults
   */
  public static async resetDefaults(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await PageOptionService.resetDefaults();
      return res.status(200).json({
        message: 'Page options reset to factory defaults',
        pageOptions: items,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default PageOptionController;
