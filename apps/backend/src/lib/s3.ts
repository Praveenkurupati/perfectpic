import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
