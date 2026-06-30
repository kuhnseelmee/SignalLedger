import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "@signalledger/config";

export const s3 = new S3Client({
  region: "us-east-1",
  endpoint: `http://${config.MINIO_ENDPOINT}`,
  credentials: {
    accessKeyId: config.MINIO_ACCESS_KEY,
    secretAccessKey: config.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

export async function createUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 900 },
  );
}

export async function createDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: key,
    }),
    { expiresIn: 900 },
  );
}
