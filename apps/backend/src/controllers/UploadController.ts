// apps/backend/src/controllers/UploadController.ts
import { Request, Response, NextFunction } from 'express';
import { generatePresignedUrl } from '../lib/s3';
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

  public static async deletePhoto(req: Request, res: Response) {
    return res.status(200).json({
      message: 'Photo deleted successfully',
    });
  }
}

export default UploadController;
