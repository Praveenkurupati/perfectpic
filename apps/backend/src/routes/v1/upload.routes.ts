// apps/backend/src/routes/v1/upload.routes.ts
import { Router } from 'express';
import { UploadController } from '../../controllers/UploadController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/presign', optionalAuth, UploadController.presign);
router.post('/complete', optionalAuth, UploadController.complete);
router.delete('/:photoId', optionalAuth, UploadController.deletePhoto);

export default router;
