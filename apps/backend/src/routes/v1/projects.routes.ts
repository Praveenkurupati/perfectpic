// apps/backend/src/routes/v1/projects.routes.ts
import { Router } from 'express';
import { ProjectController } from '../../controllers/ProjectController';
import { optionalAuth } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate';
import { CreateProjectSchema, UpdateProjectSchema } from '@repo/types';

const router = Router();

// Apply optionalAuth across all project endpoints (attaches req.user if Bearer token present)
router.use(optionalAuth);

// List projects (scoped to authenticated user, guest session, or all if admin)
router.get('/', ProjectController.getProjects);

// List abandoned projects eligible for re-engagement reminders
router.get('/abandoned', ProjectController.getAbandonedProjects);

// Get CRM recovery metrics (trapped pipeline value, 30-day recovery %, stage breakdown)
router.get('/recovery-metrics', ProjectController.getRecoveryMetrics);

// Process batch re-engagement reminders across WhatsApp and Email
router.post('/process-reminders', ProjectController.processReminders);

// Get single project by ID (verifies tenant ownership)
router.get('/:id', ProjectController.getProjectById);

// Create new project draft with schema validation
router.post('/', validateBody(CreateProjectSchema), ProjectController.createProject);

// Duplicate existing project
router.post('/:id/duplicate', ProjectController.duplicateProject);

// Rename project
router.patch('/:id/rename', ProjectController.renameProject);

// Send personalized resume project reminder via WhatsApp and Email
router.post('/:id/reminder', ProjectController.sendResumeReminder);

// Update project canvas / spreads / photos (verifies tenant ownership and validates schema)
router.put('/:id', validateBody(UpdateProjectSchema), ProjectController.updateProject);

// Delete project (verifies tenant ownership)
router.delete('/:id', ProjectController.deleteProject);

export default router;
