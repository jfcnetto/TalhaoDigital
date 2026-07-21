import { S3Client } from '@aws-sdk/client-s3';

if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || !process.env.CLOUDFLARE_R2_ENDPOINT) {
  throw new Error('Cloudflare R2 environment variables are missing');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'talhaodigital-storage';
