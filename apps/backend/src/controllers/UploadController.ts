// apps/backend/src/controllers/UploadController.ts
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { generatePresignedUrl, uploadBufferToS3, deleteFromS3, isS3Configured, getObjectBufferFromS3 } from '../lib/s3';
import { env } from '../config/env';
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

  /**
   * Proxies an image from S3 or external URL and serves it with permissive CORS headers
   * so browser canvases and PDF generators never experience tainted canvas or CORS errors.
   */
  public static async proxyImage(req: Request, res: Response, next: NextFunction) {
    try {
      const rawUrl = req.query.url;
      const imageUrl = Array.isArray(rawUrl) ? String(rawUrl[0]) : String(rawUrl || '');
      if (!imageUrl || imageUrl === 'undefined') {
        throw ApiError.badRequest('Query parameter "url" is required.');
      }

      // 1. If it's a local uploads file
      if (imageUrl.includes('/uploads/')) {
        const relativePart = imageUrl.substring(imageUrl.indexOf('/uploads/') + '/uploads/'.length);
        const localPath = path.join(process.cwd(), 'uploads', relativePart);
        if (fs.existsSync(localPath)) {
          const ext = path.extname(localPath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
          res.setHeader('Content-Type', mime);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          return fs.createReadStream(localPath).pipe(res);
        }
      }

      // 2. If it's an S3 object (either full S3 URL or relative key)
      const isS3 = isS3Configured() && (
        (env.S3_BUCKET && imageUrl.includes(env.S3_BUCKET)) ||
        imageUrl.startsWith('photos/') ||
        imageUrl.startsWith('photobooks/')
      );

      if (isS3) {
        let key = imageUrl;
        if (imageUrl.startsWith('http')) {
          try {
            const u = new URL(imageUrl);
            key = u.pathname.replace(/^\/+/, '');
          } catch {}
        }
        const s3Obj = await getObjectBufferFromS3(key);
        if (s3Obj && s3Obj.buffer) {
          res.setHeader('Content-Type', s3Obj.contentType);
          res.setHeader('Content-Length', s3Obj.buffer.length);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          return res.status(200).send(s3Obj.buffer);
        }
      }

      // 3. External HTTP(S) URL (e.g. Unsplash or public CDN)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'PerfectPic-PDF-Renderer/1.0',
          },
        });

        if (!response.ok) {
          throw ApiError.badRequest(`Failed to fetch upstream image: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuf = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        return res.status(200).send(buffer);
      }

      throw ApiError.badRequest('Invalid image URL format.');
    } catch (err) {
      next(err);
    }
  }

  public static async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No image file provided for upload.');
      }

      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const cleanBase = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      const isPdf = req.file.mimetype === 'application/pdf' || ext === '.pdf';
      const requestedFolder = typeof req.body?.folder === 'string' ? req.body.folder.trim().replace(/[^a-zA-Z0-9_-]/g, '') : '';
      const folder = requestedFolder || (isPdf ? 'photobooks' : 'photos');
      const prefix = isPdf ? 'photobook' : 'photo';
      const filename = `${prefix}-${cleanBase}-${uniqueSuffix}${ext}`;
      const s3Key = `${folder}/${filename}`;

      // 1. Direct AWS S3 Upload (preferred for production)
      if (isS3Configured() && req.file.buffer) {
        try {
          const s3Result = await uploadBufferToS3(
            req.file.buffer,
            s3Key,
            req.file.mimetype || (isPdf ? 'application/pdf' : 'image/jpeg')
          );

          // If an associated orderId is provided, optionally link PDF directly to Order
          const orderId = req.body?.orderId || req.body?.orderNumber;
          if (orderId && isPdf) {
            try {
              const { OrderRepository } = await import('../repositories/OrderRepository');
              await OrderRepository.updatePdfUrl(orderId, s3Result.url);
            } catch (linkErr: any) {
              console.warn('Could not auto-link PDF to order:', linkErr?.message);
            }
          }

          return res.status(200).json({
            url: s3Result.url,
            filename: s3Key,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype || (isPdf ? 'application/pdf' : 'image/jpeg'),
            storage: 's3',
            bucket: s3Result.bucket,
          });
        } catch (s3Error: any) {
          console.error('⚠️ S3 Upload error, falling back to local storage:', s3Error?.message);
        }
      }

      // 2. Local disk storage fallback (for offline development)
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const targetDir = path.join(uploadsDir, folder);
      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const localPath = path.join(targetDir, filename);
        if (req.file.buffer) {
          fs.writeFileSync(localPath, req.file.buffer);
        }
      } catch (fileErr: any) {
        console.error('⚠️ Failed to write local upload file:', fileErr?.message);
      }

      const host = req.get('host') || 'localhost:4000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const fileUrl = `${protocol}://${host}/uploads/${folder}/${filename}`;

      const orderId = req.body?.orderId || req.body?.orderNumber;
      if (orderId && isPdf) {
        try {
          const { OrderRepository } = await import('../repositories/OrderRepository');
          await OrderRepository.updatePdfUrl(orderId, fileUrl);
        } catch (linkErr: any) {
          console.warn('Could not auto-link local PDF to order:', linkErr?.message);
        }
      }

      return res.status(200).json({
        url: fileUrl,
        filename: `${folder}/${filename}`,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype || (isPdf ? 'application/pdf' : 'image/jpeg'),
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
