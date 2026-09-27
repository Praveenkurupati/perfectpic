import { Router } from 'express';

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

router.get('/', (req, res) => {
  res.json({ projects: mockProjects, total: mockProjects.length });
});

router.get('/:id', (req, res) => {
  const project = mockProjects.find(p => p.id === req.params.id) || mockProjects[0];
  res.json(project);
});

router.post('/', (req, res) => {
  const newId = `proj-${Math.floor(1000 + Math.random() * 9000)}`;
  res.status(201).json({ id: newId, status: 'draft' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Project updated successfully' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Project deleted successfully' });
});

export default router;
