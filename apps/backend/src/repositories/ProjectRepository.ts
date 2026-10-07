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

const mockProjects: any[] = [];

export class ProjectRepository {
  /**
   * List projects scoped by user tenancy, guest session, or administrator privileges.
   * Defends against data leakage and IDOR.
   */
  public static async findAll(scope?: IProjectScope, filter?: { status?: string; search?: string }) {
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
          return { projects: [], total: 0 };
        }

        if (filter?.search) {
          query.title = { $regex: filter.search, $options: 'i' };
        }

        const projects = await Project.find(query).sort({ updatedAt: -1 });
        return { projects, total: projects.length };
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
      filtered = filtered.filter((p) => p.userId === scope.userId || String(p.userId) === String(scope.userId));
    } else if (scope?.guestSessionId) {
      filtered = filtered.filter((p) => p.guestSessionId === scope.guestSessionId);
    } else {
      return { projects: [], total: 0 };
    }

    if (filter?.status) {
      filtered = filtered.filter((p) => p.status?.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter?.search) {
      filtered = filtered.filter((p) => p.title?.toLowerCase().includes(filter.search!.toLowerCase()));
    }

    return { projects: filtered, total: filtered.length };
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
