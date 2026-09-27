import { Router } from 'express';
import mongoose from 'mongoose';
import { Project } from '../db/models/Project';
import { isDbConnected } from '../db/connection';

const router = Router();

const mockProjects = [
  { 
    id: 'proj-1', 
    title: 'Sri Lanka Travel Diary', 
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), 
    status: 'Draft', 
    template: 'sri-lanka-travel', 
    coverUrl: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
    pageCount: 40 
  },
  { 
    id: 'proj-2', 
    title: 'Colombia Adventure', 
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), 
    status: 'Draft', 
    template: 'colombia-adventure', 
    coverUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop',
    pageCount: 40 
  },
  { 
    id: 'proj-3', 
    title: 'Annapurna Base Camp Trek', 
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), 
    status: 'Completed', 
    template: 'annapurna-base-camp', 
    coverUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    pageCount: 48 
  },
  { 
    id: 'proj-4', 
    title: 'Our 1st Anniversary Keepsake', 
    updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), 
    status: 'Completed', 
    template: 'first-anniversary', 
    coverUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    pageCount: 36 
  }
];

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
