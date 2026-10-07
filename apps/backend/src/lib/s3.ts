import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  PutBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

/**
 * Check if real AWS S3 credentials and bucket are provided
 */
export function isS3Configured(): boolean {
  return Boolean(
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.S3_BUCKET &&
    env.AWS_ACCESS_KEY_ID !== 'dummy' &&
    env.AWS_SECRET_ACCESS_KEY !== 'dummy'
  );
}

// Singleton S3 client instance
let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client | null {
  if (!isS3Configured()) {
    return null;
  }
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3ClientInstance;
}

export interface S3UploadResult {
  url: string;
  key: string;
  eTag?: string;
  bucket: string;
}

/**
 * Upload an image buffer directly to AWS S3
 */
export async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<S3UploadResult> {
  const client = getS3Client();
  if (!client || !env.S3_BUCKET) {
    throw new Error('AWS S3 is not properly configured. Missing credentials or bucket name.');
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  const response = await client.send(command);

  // Construct standard public S3 URL
  const url = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    url,
    key,
    eTag: response.ETag,
    bucket: env.S3_BUCKET,
  };
}

/**
 * Downloads an object buffer directly from S3 using AWS SDK.
 */
export async function getObjectBufferFromS3(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const client = getS3Client();
  if (!client || !env.S3_BUCKET) {
    return null;
  }

  try {
    const cleanKey = key.replace(/^\/+/, '');
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: cleanKey,
    });

    const response = await client.send(command);
    if (!response.Body) return null;

    const bytes = await response.Body.transformToByteArray();
    return {
      buffer: Buffer.from(bytes),
      contentType: response.ContentType || 'image/jpeg',
    };
  } catch (err: any) {
    console.warn(`S3 getObject failed for key "${key}":`, err?.message);
    return null;
  }
}

/**
 * Automatically ensures the S3 bucket has standard permissive CORS configuration,
 * allowing web applications to load photos into HTML5 Canvas and jsPDF without tainted canvas errors.
 */
export async function ensureS3Cors(): Promise<boolean> {
  const client = getS3Client();
  if (!client || !env.S3_BUCKET) {
    return false;
  }

  try {
    const command = new PutBucketCorsCommand({
      Bucket: env.S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag', 'x-amz-meta-custom-header'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });

    await client.send(command);
    return true;
  } catch (err: any) {
    console.warn('Notice: Could not auto-apply S3 CORS configuration:', err?.message);
    return false;
  }
}

/**
 * Ensures strict 30-day data retention lifecycle policy on AWS S3 temporary uploads.
 * Automatically deletes transient uploads and photos in uploads/ and photos/temp/ older than 30 days.
 */
export async function ensureS3LifecycleConfiguration(): Promise<boolean> {
  const client = getS3Client();
  if (!client || !env.S3_BUCKET) {
    return false;
  }

  try {
    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: env.S3_BUCKET,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: 'AutoPruneTempUploads30Days',
            Filter: { Prefix: 'uploads/' },
            Status: 'Enabled',
            Expiration: { Days: 30 },
            AbortIncompleteMultipartUpload: { DaysAfterInitiation: 7 },
          },
          {
            ID: 'AutoPruneTempPhotos30Days',
            Filter: { Prefix: 'photos/temp/' },
            Status: 'Enabled',
            Expiration: { Days: 30 },
            AbortIncompleteMultipartUpload: { DaysAfterInitiation: 7 },
          },
        ],
      },
    });

    await client.send(command);
    console.info('🛡️ [S3 Retention] 30-day photo lifecycle retention rule verified on bucket:', env.S3_BUCKET);
    return true;
  } catch (err: any) {
    console.warn('Notice: Could not auto-apply S3 lifecycle configuration:', err?.message);
    return false;
  }
}

/**
 * Generate a pre-signed PUT URL for direct client-to-S3 upload
 */
export async function generatePresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();
  if (!client || !env.S3_BUCKET) {
    return `https://mock-s3-bucket.s3.amazonaws.com/${key}`;
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete an object from S3 by its key
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client || !env.S3_BUCKET) {
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.error('Failed to delete S3 object:', key, err);
    return false;
  }
}

/**
 * Generate a pre-signed GET URL for direct client access (EA-01),
 * completely bypassing API server bandwidth and memory buffering.
 */
export async function generatePresignedGetUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();
  const cleanKey = key.replace(/^\/+/, '');
  if (!client || !env.S3_BUCKET) {
    return `https://${env.S3_BUCKET || 'perfectpic-assets'}.s3.amazonaws.com/${cleanKey}`;
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: cleanKey,
  });

  return getSignedUrl(client, command, { expiresIn });
}
