/**
 * Object storage via AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`).
 *
 * Local: S3Proxy in `infra/docker-compose.yml` — set `S3_ENDPOINT` (path-style).
 * Data dir: `infra/volumes/s3/<bucket>/…`
 * Prod: real S3/compatible; leave `S3_ENDPOINT` empty for AWS default hostname.
 */
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "../config/env.js"
import { logger } from "./logger.js"

let client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!client) {
    const endpoint = env.S3_ENDPOINT?.trim()
    client = new S3Client({
      region: env.AWS_REGION,
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle: true,
          }
        : {}),
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "localsecret",
      },
    })
  }
  return client
}

export function isS3Configured(): boolean {
  return Boolean(env.AWS_S3_BUCKET?.trim())
}

export function s3Bucket(): string {
  const b = env.AWS_S3_BUCKET?.trim()
  if (!b) throw new Error("AWS_S3_BUCKET is not configured")
  return b
}

/** Create bucket if missing (S3Proxy filesystem + first-time local seed). */
export async function ensureBucket(bucket = env.AWS_S3_BUCKET): Promise<void> {
  const name = bucket?.trim()
  if (!name) return
  const c = getS3Client()
  try {
    await c.send(new HeadBucketCommand({ Bucket: name }))
    return
  } catch {
    // create
  }
  try {
    await c.send(new CreateBucketCommand({ Bucket: name }))
    logger.info({ bucket: name, endpoint: env.S3_ENDPOINT }, "S3 bucket created")
  } catch (err) {
    // Race or already exists
    logger.warn({ err, bucket: name }, "S3 ensureBucket create failed (may already exist)")
  }
}

export async function presignPut(input: {
  key: string
  contentType: string
  expiresInSeconds?: number
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: s3Bucket(),
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
  const command = new GetObjectCommand({
    Bucket: s3Bucket(),
    Key: input.key,
  })

  return getSignedUrl(getS3Client(), command, {
    expiresIn: input.expiresInSeconds ?? 900,
  })
}

export async function putObject(input: {
  key: string
  body: string | Uint8Array | Buffer
  contentType: string
}): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    })
  )
}

export async function getObjectText(key: string): Promise<string | null> {
  if (!isS3Configured()) return null
  try {
    const res = await getS3Client().send(
      new GetObjectCommand({
        Bucket: s3Bucket(),
        Key: key,
      })
    )
    const body = res.Body
    if (!body) return null
    return await body.transformToString()
  } catch {
    return null
  }
}

/** Best-effort delete; ignores missing objects / unconfigured S3. */
export async function deleteObject(key: string): Promise<void> {
  if (!isS3Configured() || !key.trim()) return
  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: s3Bucket(),
        Key: key,
      })
    )
  } catch (err) {
    logger.warn({ err, key }, "S3 deleteObject failed")
  }
}

export async function getObjectBytes(
  key: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!isS3Configured() || !key.trim()) return null
  try {
    const res = await getS3Client().send(
      new GetObjectCommand({
        Bucket: s3Bucket(),
        Key: key,
      })
    )
    if (!res.Body) return null
    const body = await res.Body.transformToByteArray()
    return {
      body,
      contentType: res.ContentType?.trim() || "application/octet-stream",
    }
  } catch (err) {
    logger.warn({ err, key }, "S3 getObjectBytes failed")
    return null
  }
}
