import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../../controllers/UploadController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Configure multer memory storage so file buffers are kept in RAM for direct S3 streaming
const storage = multer.memoryStorage();

const IMAGE_EXTENSIONS_REGEX = /\.(jpe?g|png|webp|avif|heic|heif|gif|bmp|tiff?|dng|raw|cr2|nef|arw|svg)$/i;

const upload = multer({
  storage,
  limits: { fileSize: 45 * 1024 * 1024 }, // 45MB limit for high-res photos and HD print PDFs
  fileFilter: (_req, file, cb) => {
    const isImageMime = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isImageExt = IMAGE_EXTENSIONS_REGEX.test(file.originalname);

    if (isImageMime || isPdf || isImageExt) {
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
