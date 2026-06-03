import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFile } from 'fs/promises';

function createS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadToS3({ key, filePath, contentType, bucket }) {
  const s3 = createS3Client();
  const body = await readFile(filePath);
  await s3.send(new PutObjectCommand({
    Bucket: bucket || process.env.S3_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function uploadBufferToS3({ key, buffer, contentType, bucket }) {
  const s3 = createS3Client();
  await s3.send(new PutObjectCommand({
    Bucket: bucket || process.env.S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function getPresignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  const s3 = createS3Client();
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteFromS3(key, bucket) {
  const s3 = createS3Client();
  await s3.send(new DeleteObjectCommand({
    Bucket: bucket || process.env.S3_BUCKET_NAME,
    Key: key,
  }));
}

export async function getObjectFromS3(key, bucket) {
  const s3 = createS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket || process.env.S3_BUCKET_NAME,
    Key: key,
  });
  const response = await s3.send(command);
  return response.Body;
}