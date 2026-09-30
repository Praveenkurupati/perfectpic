// apps/backend/src/controllers/UploadController.ts
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { generatePresignedUrl, uploadBufferToS3, deleteFromS3, isS3Configured } from '../lib/s3';
import { ApiError } from '../utils/apiError';

export class UploadController {
  public static async presign(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, contentType } = req.body;
      if (!filename || !contentType) {
        throw ApiError.badRequest('Filename and contentType are required.');
      }

      const key = `uploads/${req.user?.id || 'guest'}/${Date.now()}-${filename}`;
      const url = await generatePresignedUrl(key, contentType);

      return res.status(200).json({ url, key });
    } catch (err) {
      next(err);
    }
  }

  public static async complete(req: Request, res: Response) {
    return res.status(200).json({
      message: 'Upload marked as complete',
      photoId: 'photo_' + Date.now(),
    });
  }

  public static async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No image file provided for upload.');
      }

      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const cleanBase = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `photo-${cleanBase}-${uniqueSuffix}${ext}`;
      const s3Key = `photos/${filename}`;

      // 1. Direct AWS S3 Upload (preferred for production)
      if (isS3Configured() && req.file.buffer) {
        try {
          const s3Result = await uploadBufferToS3(
            req.file.buffer,
            s3Key,
            req.file.mimetype || 'image/jpeg'
          );

          return res.status(200).json({
            url: s3Result.url,
            filename: s3Key,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            storage: 's3',
            bucket: s3Result.bucket,
          });
        } catch (s3Error: any) {
          console.error('⚠️ S3 Upload error, falling back to local storage:', s3Error?.message);
        }
      }

      // 2. Local disk storage fallback (for offline development)
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const localPath = path.join(uploadsDir, filename);
      if (req.file.buffer) {
        fs.writeFileSync(localPath, req.file.buffer);
      }

      const host = req.get('host') || 'localhost:4000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const fileUrl = `${protocol}://${host}/uploads/${filename}`;

      return res.status(200).json({
        url: fileUrl,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        storage: 'local',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deletePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const rawId = req.params.photoId;
      const photoId = Array.isArray(rawId) ? rawId[0] : rawId;
      if (photoId && typeof photoId === 'string') {
        if (photoId.startsWith('photos/') || photoId.startsWith('uploads/')) {
          await deleteFromS3(photoId);
        } else {
          const localPath = path.join(process.cwd(), 'uploads', photoId);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        }
      }
      return res.status(200).json({
        message: 'Photo deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export default UploadController;
