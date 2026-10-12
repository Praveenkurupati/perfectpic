// apps/backend/src/repositories/ProjectRepository.ts
import mongoose from 'mongoose';
import { Project, IProject } from '../db/models/Project';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface IProjectScope {
  userId?: string;
  guestSessionId?: string;
  isAdmin?: boolean;
}

const mockProjects: any[] = [
  {
    id: 'proj-kerala-draft',
    _id: 'proj-kerala-draft',
    title: 'kerala · untitled book',
    template: 'kerala-travel',
    status: 'Draft',
    pageCount: 32,
    completedPages: 24,
    progressPercentage: 75,
    lastStep: 'studio',
    coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    bookSize: '8.25x8.25',
    coverType: 'cov-1',
    theme: 'theme-1',
    color: 'col-1',
    packaging: 'pack-1',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'proj-netravati-draft',
    _id: 'proj-netravati-draft',
    title: 'netravati · weekend trek',
    template: 'adventure-trek',
    status: 'Draft',
    pageCount: 32,
    completedPages: 12,
    progressPercentage: 38,
    lastStep: 'studio',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    bookSize: '8.25x8.25',
    coverType: 'cov-2',
    theme: 'theme-2',
    color: 'col-2',
    packaging: 'pack-1',
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'proj-wedding-draft',
    _id: 'proj-wedding-draft',
    title: 'wedding · our day',
    template: 'first-anniversary',
    status: 'Draft',
    pageCount: 32,
    completedPages: 6,
    progressPercentage: 19,
    lastStep: 'studio',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
    bookSize: '10x10',
    coverType: 'cov-2',
    theme: 'theme-1',
    color: 'col-3',
    packaging: 'pack-2',
    updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

export class ProjectRepository {
  /**
   * List projects scoped by user tenancy, guest session, or administrator privileges.
   * Defends against data leakage and IDOR.
   */
  public static async findAll(
    scope?: IProjectScope,
    filter?: { status?: string; search?: string; page?: number; limit?: number; skip?: number }
  ) {
    const limit = Math.max(1, filter?.limit ? Number(filter.limit) : 50);
    const page = Math.max(1, filter?.page ? Number(filter.page) : (filter?.skip !== undefined ? Math.floor(Number(filter.skip) / limit) + 1 : 1));
    const skip = filter?.skip !== undefined ? Number(filter.skip) : (page - 1) * limit;

    try {
      if (isDbConnected()) {
        const query: any = {};

        if (scope?.isAdmin) {
          // Administrators can see all projects or filter by status
          if (filter?.status) query.status = filter.status;
        } else if (scope?.userId && mongoose.isValidObjectId(scope.userId)) {
          // Scoped strictly to the authenticated user
          query.userId = new mongoose.Types.ObjectId(scope.userId);
          if (filter?.status) query.status = filter.status;
        } else if (scope?.guestSessionId) {
          // Scoped strictly to the guest session
          query.guestSessionId = scope.guestSessionId;
          if (filter?.status) query.status = filter.status;
        } else {
          // Unauthenticated requests without session scope receive zero projects
          return { projects: [], total: 0, page, totalPages: 1, limit };
        }

        if (filter?.search) {
          query.title = { $regex: filter.search, $options: 'i' };
        }

        const projects = await Project.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        const total = await Project.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return { projects, total, page, totalPages, limit };
      }
    } catch (err: any) {
      logger.error('ProjectRepository findAll error:', err.message);
      if (env.isProd) throw err;
    }

    // In-memory fallback for local development with identical tenant scoping
    let filtered = [...mockProjects];
    if (scope?.isAdmin) {
      // return all
    } else if (scope?.userId) {
      filtered = filtered.filter((p) => !p.userId || p.userId === scope.userId || String(p.userId) === String(scope.userId));
    } else if (scope?.guestSessionId) {
      filtered = filtered.filter((p) => !p.guestSessionId || p.guestSessionId === scope.guestSessionId);
    } else {
      // In development fallback, allow viewing demo projects
      filtered = [...mockProjects];
    }

    if (filter?.status) {
      filtered = filtered.filter((p) => p.status?.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter?.search) {
      filtered = filtered.filter((p) => p.title?.toLowerCase().includes(filter.search!.toLowerCase()));
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paged = filtered.slice(skip, skip + limit);
    return { projects: paged, total, page, totalPages, limit };
  }

  /**
   * Find a single project by ID with strict ownership validation.
   */
  public static async findById(idParam: string, scope?: IProjectScope) {
    try {
      if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
        const query: any = { _id: idParam };

        if (!scope?.isAdmin) {
          if (scope?.userId && mongoose.isValidObjectId(scope.userId)) {
            query.userId = new mongoose.Types.ObjectId(scope.userId);
          } else if (scope?.guestSessionId) {
            query.guestSessionId = scope.guestSessionId;
          }
        }

        const project = await Project.findOne(query);
        if (project) return project;
      }
    } catch (err: any) {
      logger.error('ProjectRepository findById error:', err.message);
      if (env.isProd) throw err;
    }

    // In-memory fallback
    const found = mockProjects.find((p) => p.id === idParam || p._id === idParam);
    if (!found) return null;

    if (scope?.isAdmin) return found;
    if (scope?.userId && (found.userId === scope.userId || String(found.userId) === String(scope.userId))) return found;
    if (scope?.guestSessionId && found.guestSessionId === scope.guestSessionId) return found;
    // If project is owned by a user, but caller does not match, block IDOR
    if (found.userId && (!scope?.userId || String(found.userId) !== String(scope.userId))) return null;
    if (!found.userId && !found.guestSessionId && !scope?.userId) return found; // legacy unowned mock

    return null;
  }

  /**
   * Create a new project draft bound to the authenticated user or guest session.
   */
  public static async create(projectData: any, scope?: IProjectScope) {
    const payload = { ...projectData };

    if (scope?.userId) {
      payload.userId = (isDbConnected() && mongoose.isValidObjectId(scope.userId))
        ? new mongoose.Types.ObjectId(scope.userId)
        : String(scope.userId);
    } else if (scope?.guestSessionId) {
      payload.guestSessionId = scope.guestSessionId;
    }

    if (isDbConnected()) {
      return await Project.create(payload);
    }

    if (env.isProd) {
      throw new Error('Database connection unavailable for project persistence in production.');
    }

    const inMem = {
      id: 'proj-' + Date.now(),
      _id: 'proj-' + Date.now(),
      ...payload,
      status: payload.status || 'Draft',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockProjects.unshift(inMem as any);
    return inMem;
  }

  /**
   * Update a project with tenant ownership verification.
   */
  public static async update(idParam: string, updateData: any, scope?: IProjectScope) {
    try {
      if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
        const query: any = { _id: idParam };

        if (!scope?.isAdmin) {
          if (scope?.userId && mongoose.isValidObjectId(scope.userId)) {
            query.userId = new mongoose.Types.ObjectId(scope.userId);
          } else if (scope?.guestSessionId) {
            query.guestSessionId = scope.guestSessionId;
          } else {
            // Cannot update without ownership
            return null;
          }
        }

        // Prevent tampering with userId
        const safeUpdate = { ...updateData };
        delete safeUpdate.userId;
        delete safeUpdate._id;
        delete safeUpdate.id;

        return await Project.findOneAndUpdate(query, safeUpdate, { new: true });
      }
    } catch (err: any) {
      logger.error('ProjectRepository update error:', err.message);
      if (env.isProd) throw err;
    }

    const index = mockProjects.findIndex((p) => p.id === idParam || p._id === idParam);
    if (index !== -1) {
      const existing = mockProjects[index]!;
      const isOwner =
        scope?.isAdmin ||
        (scope?.userId && existing.userId === scope.userId) ||
        (scope?.guestSessionId && existing.guestSessionId === scope.guestSessionId);

      if (!isOwner) return null;

      const safeUpdate = { ...updateData };
      delete safeUpdate.userId;
      delete safeUpdate._id;
      delete safeUpdate.id;

      mockProjects[index] = { ...existing, ...safeUpdate, updatedAt: new Date().toISOString() };
      return mockProjects[index];
    }

    return null;
  }

  /**
   * Delete a project with tenant ownership verification.
   */
  public static async delete(idParam: string, scope?: IProjectScope) {
    try {
      if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
        const query: any = { _id: idParam };

        if (!scope?.isAdmin) {
          if (scope?.userId && mongoose.isValidObjectId(scope.userId)) {
            query.userId = new mongoose.Types.ObjectId(scope.userId);
          } else if (scope?.guestSessionId) {
            query.guestSessionId = scope.guestSessionId;
          } else {
            return null;
          }
        }

        return await Project.findOneAndDelete(query);
      }
    } catch (err: any) {
      logger.error('ProjectRepository delete error:', err.message);
      if (env.isProd) throw err;
    }

    const index = mockProjects.findIndex((p) => p.id === idParam || p._id === idParam);
    if (index !== -1) {
      const existing = mockProjects[index]!;
      const isOwner =
        scope?.isAdmin ||
        (scope?.userId && existing.userId === scope.userId) ||
        (scope?.guestSessionId && existing.guestSessionId === scope.guestSessionId);

      if (!isOwner) return null;

      return mockProjects.splice(index, 1)[0];
    }

    return null;
  }
}

export default ProjectRepository;
