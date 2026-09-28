// apps/backend/src/controllers/ProjectController.ts
import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/ProjectService';

export class ProjectController {
  public static async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProjectService.getProjects();
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const project = await ProjectService.getProjectById(id);
      return res.status(200).json(project);
    } catch (err) {
      next(err);
    }
  }

  public static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await ProjectService.createProject(req.body);
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
      const updated = await ProjectService.updateProject(id, req.body);
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
      await ProjectService.deleteProject(id);
      return res.status(200).json({
        message: 'Project deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default ProjectController;
