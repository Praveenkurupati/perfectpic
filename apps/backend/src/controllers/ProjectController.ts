// apps/backend/src/controllers/ProjectController.ts
import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/ProjectService';
import { IProjectScope } from '../repositories/ProjectRepository';

function extractScope(req: Request): IProjectScope {
  const userId = req.user?.id;
  const isAdmin = req.user?.role === 'admin';
  const guestSessionId =
    (req.headers['x-guest-session-id'] as string) ||
    req.body?.guestSessionId ||
    (req.query?.guestSessionId as string) ||
    undefined;

  return { userId, guestSessionId, isAdmin };
}

export class ProjectController {
  public static async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const scope = extractScope(req);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
      const filter = {
        status: req.query.status as string,
        search: req.query.search as string,
        page,
        limit,
        skip,
      };
      const result = await ProjectService.getProjects(scope, filter);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const scope = extractScope(req);
      const project = await ProjectService.getProjectById(id, scope);
      return res.status(200).json(project);
    } catch (err) {
      next(err);
    }
  }

  public static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const scope = extractScope(req);
      const project = await ProjectService.createProject(req.body, scope);
      return res.status(201).json({
        id: (project as any).id || (project as any)._id,
        project,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const scope = extractScope(req);
      const updated = await ProjectService.updateProject(id, req.body, scope);
      return res.status(200).json({
        message: 'Project updated successfully',
        project: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async duplicateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const scope = extractScope(req);
      const cloned = await ProjectService.duplicateProject(id, scope);
      return res.status(201).json({
        message: 'Project duplicated successfully',
        id: (cloned as any).id || (cloned as any)._id,
        project: cloned,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async renameProject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { title } = req.body;
      const scope = extractScope(req);
      const updated = await ProjectService.renameProject(id, title, scope);
      return res.status(200).json({
        message: 'Project renamed successfully',
        project: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAbandonedProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const { ProjectReminderService } = await import('../services/ProjectReminderService');
      const thresholdHours = req.query.hours ? parseInt(req.query.hours as string, 10) : undefined;
      const stageParam = req.query.stage;
      const stage = stageParam === '1' ? 1 : stageParam === '2' ? 2 : stageParam === '3' ? 3 : 'all';
      const search = req.query.search ? String(req.query.search) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const abandoned = await ProjectReminderService.getAbandonedProjects({
        thresholdHours,
        stage,
        search,
        limit,
      });

      return res.status(200).json({
        total: abandoned.length,
        projects: abandoned,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getRecoveryMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { ProjectReminderService } = await import('../services/ProjectReminderService');
      const metrics = await ProjectReminderService.getRecoveryMetrics();
      return res.status(200).json(metrics);
    } catch (err) {
      next(err);
    }
  }

  public static async sendResumeReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { channel, stage, customPhone, customEmail, customName, promoCode } = req.body || {};
      const { ProjectReminderService } = await import('../services/ProjectReminderService');
      const result = await ProjectReminderService.sendResumeReminder(id, {
        channel,
        stage: stage ? Number(stage) : undefined,
        customPhone,
        customEmail,
        customName,
        promoCode,
      });
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async processReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const { ProjectReminderService } = await import('../services/ProjectReminderService');
      const summary = await ProjectReminderService.processPendingReminders();
      return res.status(200).json({
        message: 'Automated multi-stage abandoned draft reminders processed successfully',
        summary,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const scope = extractScope(req);
      await ProjectService.deleteProject(id, scope);
      return res.status(200).json({
        message: 'Project deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default ProjectController;
