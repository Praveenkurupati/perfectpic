// apps/backend/src/routes/v1/projects.routes.ts
import { Router } from 'express';
import { ProjectController } from '../../controllers/ProjectController';

const router = Router();

// List user projects
router.get('/', ProjectController.getProjects);

// Get single project by ID
router.get('/:id', ProjectController.getProjectById);

// Create new project draft
router.post('/', ProjectController.createProject);

// Update project canvas / spreads / photos
router.put('/:id', ProjectController.updateProject);

// Delete project
router.delete('/:id', ProjectController.deleteProject);

export default router;
