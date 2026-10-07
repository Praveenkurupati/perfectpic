// apps/backend/src/controllers/BackupController.ts
import { Request, Response, NextFunction } from 'express';
import { BackupService } from '../services/BackupService';

export class BackupController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const backups = BackupService.listBackups();
      return res.status(200).json({
        success: true,
        count: backups.length,
        retentionPolicyDays: 30,
        backups,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const retentionDays = Number(req.body.retentionDays) || 30;
      const metadata = await BackupService.createBackup(retentionDays);
      return res.status(201).json({
        success: true,
        message: 'MongoDB backup created successfully',
        backup: metadata,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async prune(req: Request, res: Response, next: NextFunction) {
    try {
      const retentionDays = Number(req.body.retentionDays) || 30;
      const result = await BackupService.pruneOldBackups(retentionDays);
      return res.status(200).json({
        success: true,
        message: `Pruned ${result.prunedCount} expired backups older than ${retentionDays} days`,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default BackupController;
