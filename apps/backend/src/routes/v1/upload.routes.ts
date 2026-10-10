import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../../controllers/UploadController';
import { optionalAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Configure multer memory storage so file buffers are kept in RAM for direct S3 streaming
const storage = multer.memoryStorage();

// Permitted photo formats (excluding vector SVG which can carry embedded scripts/XSS)
const IMAGE_EXTENSIONS_REGEX = /\.(jpe?g|png|webp|avif|heic|heif|gif|bmp|tiff?|dng|raw|cr2|nef|arw)$/i;

const upload = multer({
  storage,
  limits: { fileSize: 45 * 1024 * 1024 }, // 45MB limit for high-res photos and HD print PDFs
  fileFilter: (_req, file, cb) => {
    // Explicitly reject SVGs due to script injection risks
    if (file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg')) {
      return cb(new Error('Vector SVG files are not permitted for photobook uploads. Please use JPG, PNG, WebP, or HEIC.'));
    }

    const isImageMime = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isImageExt = IMAGE_EXTENSIONS_REGEX.test(file.originalname);

    if ((isImageMime || isImageExt || isPdf) && file.mimetype !== 'image/svg+xml') {
      cb(null, true);
    } else {
      cb(new Error('Only valid raster photo (JPEG, PNG, WebP, HEIC, TIFF) and PDF files are allowed.'));
    }
  },
});

router.get('/proxy', UploadController.proxyImage);
router.post('/file', optionalAuth, upload.single('file'), UploadController.uploadFile);
router.post('/presign', optionalAuth, UploadController.presign);
router.post('/confirm-order-pdf', optionalAuth, UploadController.confirmOrderPdf);
router.post('/complete', optionalAuth, UploadController.complete);
router.delete('/:photoId', optionalAuth, UploadController.deletePhoto);

export default router;
