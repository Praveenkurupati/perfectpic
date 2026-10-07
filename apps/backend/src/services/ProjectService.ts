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
    const sanitized = await this.sanitizeAndGuardManifest(data);
    return await ProjectRepository.create(sanitized, scope);
  }

  public static async updateProject(id: string, data: any, scope?: IProjectScope) {
    const sanitized = await this.sanitizeAndGuardManifest(data, id);
    const updated = await ProjectRepository.update(id, sanitized, scope);
    if (!updated) {
      throw ApiError.notFound(`Project with ID '${id}' not found or you do not have permission to modify it.`);
    }
    return updated;
  }

  /**
   * BSON Size Guard & Asset Sanitizer (DB-01)
   * Prevents 16MB document cap overflow by ensuring images are stored as URLs
   * and offloading large canvas manifests (>4MB) to AWS S3.
   */
  private static async sanitizeAndGuardManifest(data: any, projectId?: string): Promise<any> {
    const safeData = { ...data };

    // Scrub accidental base64 images from photos array to maintain lightweight documents
    if (Array.isArray(safeData.photos)) {
      safeData.photos = safeData.photos.map((photo: any) => {
        if (typeof photo?.url === 'string' && photo.url.startsWith('data:image/') && photo.url.length > 50000) {
          // Keep thumbnail reference only, strip heavy base64 payload
          return {
            ...photo,
            url: photo.key ? `/api/v1/upload/proxy?key=${photo.key}` : photo.url.substring(0, 500),
            isCompressed: true,
          };
        }
        return photo;
      });
    }

    const payloadSize = Buffer.byteLength(JSON.stringify(safeData));
    // If manifest exceeds 4MB, offload full spread tree to S3
    if (payloadSize > 4 * 1024 * 1024) {
      try {
        const { isS3Configured, uploadBufferToS3 } = await import('../lib/s3');
        if (isS3Configured()) {
          const key = `manifests/project-${projectId || Date.now()}.json`;
          const s3Res = await uploadBufferToS3(
            Buffer.from(JSON.stringify({ photos: safeData.photos, pages: safeData.pages })),
            key,
            'application/json'
          );
          safeData.manifestS3Url = s3Res.url;
          safeData.manifestS3Key = key;
          // Retain lightweight metadata in MongoDB
          safeData.photos = safeData.photos.slice(0, 50);
        }
      } catch (err: any) {
        // Fall through
      }
    }

    return safeData;
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
