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
