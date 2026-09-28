// apps/backend/src/repositories/ProjectRepository.ts
import mongoose from 'mongoose';
import { Project, IProject } from '../db/models/Project';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

const mockProjects: any[] = [];

export class ProjectRepository {
  public static async findAll() {
    try {
      if (isDbConnected()) {
        const projects = await Project.find().sort({ updatedAt: -1 });
        return { projects, total: projects.length };
      }
    } catch (err: any) {
      logger.error('ProjectRepository findAll error:', err.message);
    }
    return { projects: mockProjects, total: mockProjects.length };
  }

  public static async findById(idParam: string) {
    try {
      if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
        const project = await Project.findById(idParam);
        if (project) return project;
      }
    } catch (err: any) {
      logger.error('ProjectRepository findById error:', err.message);
    }
    return mockProjects.find((p) => p.id === idParam) || null;
  }

  public static async create(projectData: any) {
    if (isDbConnected()) {
      return await Project.create(projectData);
    }
    const inMem = {
      id: 'proj-' + Date.now(),
      _id: 'proj-' + Date.now(),
      ...projectData,
      status: 'Draft',
      updatedAt: new Date().toISOString(),
    };
    mockProjects.unshift(inMem as any);
    return inMem;
  }

  public static async update(idParam: string, updateData: any) {
    if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
      return await Project.findByIdAndUpdate(idParam, updateData, { new: true });
    }
    const index = mockProjects.findIndex((p) => p.id === idParam);
    if (index !== -1) {
      mockProjects[index] = { ...mockProjects[index]!, ...updateData, updatedAt: new Date().toISOString() };
      return mockProjects[index];
    }
    return null;
  }

  public static async delete(idParam: string) {
    if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
      return await Project.findByIdAndDelete(idParam);
    }
    const index = mockProjects.findIndex((p) => p.id === idParam);
    if (index !== -1) {
      return mockProjects.splice(index, 1)[0];
    }
    return null;
  }
}

export default ProjectRepository;
