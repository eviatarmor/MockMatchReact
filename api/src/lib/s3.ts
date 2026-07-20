import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "../config/env.js"

let client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.AWS_REGION,
      ...(env.S3_ENDPOINT
        ? {
            endpoint: env.S3_ENDPOINT,
            forcePathStyle: true,
          }
        : {}),
      ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    })
  }
  return client
}

export async function presignPut(input: {
  key: string
  contentType: string
  expiresInSeconds?: number
}): Promise<string> {
  if (!env.AWS_S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET is not configured")
  }

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
  })

  return getSignedUrl(getS3Client(), command, {
    expiresIn: input.expiresInSeconds ?? 900,
  })
}

export async function presignGet(input: {
  key: string
  expiresInSeconds?: number
}): Promise<string> {
  if (!env.AWS_S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET is not configured")
  }

  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: input.key,
  })

  return getSignedUrl(getS3Client(), command, {
    expiresIn: input.expiresInSeconds ?? 900,
  })
}
