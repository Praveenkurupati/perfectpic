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
      const { filename, contentType, folder, orderId } = req.body;
      if (!filename || !contentType || typeof filename !== 'string' || typeof contentType !== 'string') {
        throw ApiError.badRequest('Valid filename and contentType strings are required.');
      }

      // Approved raster photo and PDF MIME types (prohibits SVG/HTML/JS)
      const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'image/avif',
        'image/tiff',
        'image/gif',
        'application/pdf',
      ];

      const cleanMime = contentType.toLowerCase().trim();
      if (!ALLOWED_MIME_TYPES.includes(cleanMime)) {
        throw ApiError.badRequest(`Unsupported or prohibited file MIME type '${cleanMime}'.`);
      }

      // Sanitize filename against path traversal
      const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const isPdf = cleanMime === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
      const cleanOrderId = orderId ? String(orderId).replace(/[^a-zA-Z0-9_-]/g, '') : '';

      let key: string;
      if (isPdf && cleanOrderId) {
        // Proper canonical S3 key format for photobook orders
        key = `photobooks/PerfectPic-Photobook-${cleanOrderId}.pdf`;
      } else if (isPdf || folder === 'photobooks') {
        const safeBase = path.basename(safeFilename, path.extname(safeFilename));
        key = `photobooks/PerfectPic-Photobook-${Date.now()}-${safeBase}.pdf`;
      } else {
        const userId = req.user?.id ? req.user.id.replace(/[^a-zA-Z0-9_-]/g, '') : 'guest';
        key = `uploads/${userId}/${Date.now()}-${safeFilename}`;
      }

      const url = await generatePresignedUrl(key, cleanMime);
      const publicUrl = isS3Configured()
        ? `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`
        : url.split('?')[0];

      return res.status(200).json({
        url,
        key,
        publicUrl,
        bucket: env.S3_BUCKET,
      });
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
   * Hardened against SSRF and Path Traversal attacks.
   */
  public static async proxyImage(req: Request, res: Response, next: NextFunction) {
    try {
      const rawUrl = req.query.url;
      const imageUrl = Array.isArray(rawUrl) ? String(rawUrl[0]) : String(rawUrl || '');
      if (!imageUrl || imageUrl === 'undefined') {
        throw ApiError.badRequest('Query parameter "url" is required.');
      }

      // 1. If it's a local uploads file (guarded against path traversal)
      if (imageUrl.includes('/uploads/')) {
        const relativePart = imageUrl.substring(imageUrl.indexOf('/uploads/') + '/uploads/'.length);
        const baseUploads = path.resolve(process.cwd(), 'uploads');
        const localPath = path.resolve(baseUploads, relativePart);

        if (!localPath.startsWith(baseUploads)) {
          throw ApiError.forbidden('Access denied: Invalid path traversal attempt.');
        }

        if (fs.existsSync(localPath)) {
          const ext = path.extname(localPath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
          res.setHeader('Content-Type', mime);
          res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          return fs.createReadStream(localPath).pipe(res);
        }
      }

      // Extract prospective storage key
      let key = imageUrl;
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        try {
          const u = new URL(imageUrl);
          key = u.pathname.replace(/^\/+/, '');
        } catch {}
      } else if (imageUrl.startsWith('/')) {
        key = imageUrl.replace(/^\/+/, '');
      }

      // 2. If it's an S3 object (either full S3 URL or relative key)
      const isS3 = isS3Configured() && (
        (Boolean(env.S3_BUCKET) && imageUrl.includes(env.S3_BUCKET)) ||
        imageUrl.includes('.amazonaws.com') ||
        imageUrl.startsWith('photos/') ||
        imageUrl.startsWith('photobooks/') ||
        imageUrl.startsWith('uploads/') ||
        key.startsWith('photos/') ||
        key.startsWith('photobooks/') ||
        key.startsWith('uploads/')
      );

      if (isS3) {
        // Direct CloudFront / CDN distribution redirect (EA-01)
        const cdnDomain = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
        if (cdnDomain) {
          const cleanCdn = cdnDomain.replace(/\/+$/, '');
          return res.redirect(302, `${cleanCdn}/${key}`);
        }

        // Direct S3 Presigned GET redirect (bypasses Node.js RAM/CPU bottleneck)
        try {
          const { generatePresignedGetUrl } = await import('../lib/s3');
          const directSignedUrl = await generatePresignedGetUrl(key, 7200);
          return res.redirect(302, directSignedUrl);
        } catch {}

        const s3Obj = await getObjectBufferFromS3(key);
        if (s3Obj && s3Obj.buffer) {
          res.setHeader('Content-Type', s3Obj.contentType);
          res.setHeader('Content-Length', s3Obj.buffer.length);
          res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          return res.status(200).send(s3Obj.buffer);
        }
      }

      // 3. External HTTP(S) URL (SSRF protected)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        let parsed: URL;
        try {
          parsed = new URL(imageUrl);
        } catch {
          throw ApiError.badRequest('Invalid image URL format.');
        }

        const hostname = parsed.hostname.toLowerCase();

        // SSRF Defense: Block cloud metadata services and internal RFC1918 networks
        if (
          hostname === '169.254.169.254' ||
          hostname === '0.0.0.0' ||
          hostname.endsWith('.internal') ||
          hostname.endsWith('.local') ||
          (env.isProd && (hostname === 'localhost' || hostname === '127.0.0.1' || /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)))
        ) {
          throw ApiError.forbidden('Access to private network resources is prohibited.');
        }

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
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
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
      const rawOrderId = req.body?.orderId || req.body?.orderNumber;
      const cleanOrderId = rawOrderId ? String(rawOrderId).replace(/[^a-zA-Z0-9_-]/g, '') : '';

      let filename: string;
      let s3Key: string;
      let folder: string;

      if (isPdf && cleanOrderId) {
        folder = 'photobooks';
        filename = `PerfectPic-Photobook-${cleanOrderId}.pdf`;
        s3Key = `${folder}/${filename}`;
      } else if (isPdf) {
        folder = 'photobooks';
        filename = `PerfectPic-Photobook-${cleanBase}-${uniqueSuffix}.pdf`;
        s3Key = `${folder}/${filename}`;
      } else {
        folder = requestedFolder || 'photos';
        filename = `photo-${cleanBase}-${uniqueSuffix}${ext}`;
        s3Key = `${folder}/${filename}`;
      }

      // Enforce AWS S3 in production to keep container disks lightweight
      const hasS3 = isS3Configured();
      if (!hasS3 && env.isProd) {
        throw ApiError.internal('AWS S3 storage is not configured. Please ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET are configured in your server environment.');
      }

      // 1. Direct AWS S3 Upload (preferred and enforced for production)
      if (hasS3 && req.file.buffer) {
        try {
          const s3Result = await uploadBufferToS3(
            req.file.buffer,
            s3Key,
            req.file.mimetype || (isPdf ? 'application/pdf' : 'image/jpeg')
          );

          // If an associated orderId is provided, link canonical PDF directly to Order
          if (cleanOrderId && isPdf) {
            try {
              const { OrderRepository } = await import('../repositories/OrderRepository');
              await OrderRepository.updatePdfUrl(cleanOrderId, s3Result.url);
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
          console.error('❌ AWS S3 Upload Error:', s3Error?.message);
          if (env.isProd) {
            throw ApiError.internal(`Failed to upload media to AWS S3: ${s3Error?.message}`);
          }
        }
      }

      // 2. Local disk storage fallback (ONLY for offline local development)
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
      if (!photoId || typeof photoId !== 'string') {
        throw ApiError.badRequest('Photo ID parameter is required.');
      }

      // Path traversal security check
      if (photoId.includes('..')) {
        throw ApiError.badRequest('Invalid photo path.');
      }

      if (photoId.startsWith('photos/') || photoId.startsWith('photobooks/') || photoId.startsWith('uploads/')) {
        await deleteFromS3(photoId);
      } else {
        const baseUploads = path.resolve(process.cwd(), 'uploads');
        const localPath = path.resolve(baseUploads, path.basename(photoId));
        if (localPath.startsWith(baseUploads) && fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
      return res.status(200).json({
        message: 'Photo deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Confirms a photobook PDF uploaded from the client, ensures it is saved under
   * the canonical format photobooks/PerfectPic-Photobook-${orderId}.pdf in the main S3 bucket,
   * and links it authoritatively to the Order in the database.
   */
  public static async confirmOrderPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, pdfUrl, key } = req.body;
      const rawId = orderId || req.body?.orderNumber;
      if (!rawId) {
        throw ApiError.badRequest('orderId is required to confirm photobook PDF.');
      }

      const cleanOrderId = String(rawId).replace(/[^a-zA-Z0-9_-]/g, '');
      const canonicalKey = `photobooks/PerfectPic-Photobook-${cleanOrderId}.pdf`;
      let finalPdfUrl = pdfUrl;

      // If object was uploaded to a non-canonical S3 key, copy it to the canonical key
      if (isS3Configured() && key && key !== canonicalKey) {
        try {
          const { copyS3Object } = await import('../lib/s3');
          const copied = await copyS3Object(key, canonicalKey);
          finalPdfUrl = copied.url;
        } catch (copyErr: any) {
          console.warn('Notice: Could not copy S3 object to canonical key:', copyErr?.message);
        }
      }

      if (!finalPdfUrl && isS3Configured()) {
        finalPdfUrl = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${canonicalKey}`;
      }

      const { OrderRepository } = await import('../repositories/OrderRepository');
      const updatedOrder = await OrderRepository.updatePdfUrl(cleanOrderId, finalPdfUrl);

      return res.status(200).json({
        success: true,
        message: 'Photobook PDF verified and stored in main S3 bucket.',
        orderId: cleanOrderId,
        pdfUrl: finalPdfUrl,
        key: canonicalKey,
        order: updatedOrder,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default UploadController;
