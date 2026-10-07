// apps/backend/src/services/ProjectService.ts
import { ProjectRepository, IProjectScope } from '../repositories/ProjectRepository';
import { ApiError } from '../utils/apiError';

export class ProjectService {
  public static async getProjects(scope?: IProjectScope, filter?: { status?: string; search?: string; page?: number; limit?: number; skip?: number }) {
    return await ProjectRepository.findAll(scope, filter);
  }

  public static async getProjectById(id: string, scope?: IProjectScope) {
    const project = await ProjectRepository.findById(id, scope);
    if (!project) {
      throw ApiError.notFound(`Project with ID '${id}' not found or access denied.`);
    }
    return project;
  }

  public static async createProject(data: any, scope?: IProjectScope) {
    if (!data.title) {
      throw ApiError.badRequest('Project title is required.');
    }
    return await ProjectRepository.create(data, scope);
  }

  public static async updateProject(id: string, data: any, scope?: IProjectScope) {
    const updated = await ProjectRepository.update(id, data, scope);
    if (!updated) {
      throw ApiError.notFound(`Project with ID '${id}' not found or you do not have permission to modify it.`);
    }
    return updated;
  }

  public static async deleteProject(id: string, scope?: IProjectScope) {
    const deleted = await ProjectRepository.delete(id, scope);
    if (!deleted) {
      throw ApiError.notFound(`Project with ID '${id}' not found or you do not have permission to delete it.`);
    }
    return deleted;
  }
}

export default ProjectService;
