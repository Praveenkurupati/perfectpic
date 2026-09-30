import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../../controllers/UploadController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Configure multer memory storage so file buffers are kept in RAM for direct S3 streaming
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 45 * 1024 * 1024 }, // 45MB limit for high-res photos and HD print PDFs
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed.'));
    }
  },
});

router.get('/proxy', UploadController.proxyImage);
router.post('/file', optionalAuth, upload.single('file'), UploadController.uploadFile);
router.post('/presign', optionalAuth, UploadController.presign);
router.post('/complete', optionalAuth, UploadController.complete);
router.delete('/:photoId', optionalAuth, UploadController.deletePhoto);

export default router;
