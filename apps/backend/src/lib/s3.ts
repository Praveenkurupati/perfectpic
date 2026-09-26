import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Dummy client for testing without credentials
const createClient = () => {
  try {
    return new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "dummy",
        secretAccessKey: process.env.AWS_SECRET_KEY || "dummy",
      },
    });
  } catch (e) {
    return null;
  }
};

const s3Client = createClient();

export const generatePresignedUrl = async (key: string, contentType: string, expiresIn = 3600) => {
  if (!s3Client || !process.env.AWS_BUCKET) {
    // Return mock url for development if env not fully configured
    return `https://mock-s3-bucket.s3.amazonaws.com/${key}`;
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};
