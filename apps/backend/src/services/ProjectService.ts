// apps/backend/src/services/ProjectService.ts
import { ProjectRepository } from '../repositories/ProjectRepository';
import { ApiError } from '../utils/apiError';

export class ProjectService {
  public static async getProjects() {
    return await ProjectRepository.findAll();
  }

  public static async getProjectById(id: string) {
    const project = await ProjectRepository.findById(id);
    if (!project) {
      throw ApiError.notFound(`Project with ID '${id}' not found.`);
    }
    return project;
  }

  public static async createProject(data: any) {
    if (!data.title) {
      throw ApiError.badRequest('Project title is required.');
    }
    return await ProjectRepository.create(data);
  }

  public static async updateProject(id: string, data: any) {
    const updated = await ProjectRepository.update(id, data);
    if (!updated) {
      throw ApiError.notFound(`Project with ID '${id}' not found.`);
    }
    return updated;
  }

  public static async deleteProject(id: string) {
    const deleted = await ProjectRepository.delete(id);
    if (!deleted) {
      throw ApiError.notFound(`Project with ID '${id}' not found.`);
    }
    return deleted;
  }
}

export default ProjectService;
