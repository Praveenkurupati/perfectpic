import { Router } from 'express';
import mongoose from 'mongoose';
import { Project } from '../db/models/Project';
import { isDbConnected } from '../db/connection';

const router = Router();

const mockProjects: any[] = [];

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const projects = await Project.find().sort({ updatedAt: -1 });
      return res.json({ projects, total: projects.length });
    }
  } catch (err) {
    console.error('MongoDB projects query error:', err);
  }

  res.json({ projects: mockProjects, total: mockProjects.length });
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  const idParam = req.params.id;

  try {
    if (isDbConnected()) {
      let filter: any = {};
      if (mongoose.isValidObjectId(idParam)) {
        filter = { _id: idParam };
      } else {
        filter = { template: idParam };
      }
      const project = await Project.findOne(filter);
      if (project) {
        return res.json(project);
      }
    }
  } catch (err) {
    console.error('MongoDB single project query error:', err);
  }

  const project = mockProjects.find(p => p.id === idParam) || mockProjects[0];
  res.json(project);
});

// POST /api/projects
router.post('/', async (req, res) => {
  const body = req.body || {};

  try {
    if (isDbConnected()) {
      const created = await Project.create({
        title: body.title || 'Untitled Photobook',
        template: body.template || 'custom',
        status: body.status || 'Draft',
        coverUrl: body.coverUrl || body.coverImage || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
        coverImage: body.coverImage || body.coverUrl || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
        pageCount: Number(body.pageCount) || 40,
        bookSize: body.bookSize || '8.25x8.25',
        coverType: body.coverType || 'cov-1',
        theme: body.theme || 'theme-1',
        color: body.color || 'col-1',
        packaging: body.packaging || 'pack-1',
        photos: body.photos || [],
        pages: body.pages || []
      });
      return res.status(201).json({ id: created.id, project: created, status: created.status });
    }
  } catch (err) {
    console.error('MongoDB project creation error:', err);
  }

  const newId = `proj-${Math.floor(1000 + Math.random() * 9000)}`;
  const newProj = {
    id: newId,
    title: body.title || 'Untitled Photobook',
    updatedAt: new Date().toISOString(),
    status: 'Draft',
    template: body.template || 'custom',
    coverUrl: body.coverUrl || body.coverImage || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
    coverImage: body.coverImage || body.coverUrl || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop',
    pageCount: Number(body.pageCount) || 40
  };
  mockProjects.unshift(newProj);
  res.status(201).json({ id: newId, project: newProj, status: 'Draft' });
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  const idParam = req.params.id;

  try {
    if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
      const updated = await Project.findByIdAndUpdate(idParam, req.body, { new: true });
      if (updated) {
        return res.json({ message: 'Project updated successfully in MongoDB', project: updated });
      }
    }
  } catch (err) {
    console.error('MongoDB project update error:', err);
  }

  const proj = mockProjects.find(p => p.id === idParam);
  if (proj) {
    Object.assign(proj, req.body, { updatedAt: new Date().toISOString() });
    return res.json({ message: 'Project updated successfully', project: proj });
  }

  res.json({ message: 'Project updated successfully' });
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  const idParam = req.params.id;

  try {
    if (isDbConnected() && mongoose.isValidObjectId(idParam)) {
      await Project.findByIdAndDelete(idParam);
      return res.json({ message: 'Project deleted successfully from MongoDB' });
    }
  } catch (err) {
    console.error('MongoDB project delete error:', err);
  }

  const idx = mockProjects.findIndex(p => p.id === idParam);
  if (idx !== -1) {
    mockProjects.splice(idx, 1);
  }
  res.json({ message: 'Project deleted successfully' });
});

export default router;
