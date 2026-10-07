// apps/backend/src/routes/v1/projects.routes.ts
import { Router } from 'express';
import { ProjectController } from '../../controllers/ProjectController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Apply optionalAuth across all project endpoints (attaches req.user if Bearer token present)
router.use(optionalAuth);

// List projects (scoped to authenticated user, guest session, or all if admin)
router.get('/', ProjectController.getProjects);

// Get single project by ID (verifies tenant ownership)
router.get('/:id', ProjectController.getProjectById);

// Create new project draft
router.post('/', ProjectController.createProject);

// Update project canvas / spreads / photos (verifies tenant ownership)
router.put('/:id', ProjectController.updateProject);

// Delete project (verifies tenant ownership)
router.delete('/:id', ProjectController.deleteProject);

export default router;
