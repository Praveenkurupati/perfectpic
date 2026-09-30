import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../../controllers/UploadController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Configure multer memory storage so file buffers are kept in RAM for direct S3 streaming
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

router.post('/file', optionalAuth, upload.single('file'), UploadController.uploadFile);
router.post('/presign', optionalAuth, UploadController.presign);
router.post('/complete', optionalAuth, UploadController.complete);
router.delete('/:photoId', optionalAuth, UploadController.deletePhoto);

export default router;
