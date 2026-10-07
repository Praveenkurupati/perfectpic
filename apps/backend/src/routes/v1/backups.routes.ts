// apps/backend/src/routes/v1/backups.routes.ts
import { Router } from 'express';
import { BackupController } from '../../controllers/BackupController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// All backup operations are strictly restricted to authenticated administrators
router.get('/', authenticate, adminOnly, BackupController.list);
router.post('/create', authenticate, adminOnly, BackupController.create);
router.post('/prune', authenticate, adminOnly, BackupController.prune);

export default router;
