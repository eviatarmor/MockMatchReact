import {
  ensureBucket,
  getObjectText,
  isS3Configured,
  putObject,
} from "../../lib/s3.js"
import type {
  ExerciseContentCache,
  ExerciseContentManifest,
} from "../../db/schema/practice-exercises.js"
import { logger } from "../../lib/logger.js"

/**
 * Resolve file bodies for an exercise.
 * Prefer S3 when configured; fall back to content_cache (local/dev).
 */
export async function loadExerciseFiles(input: {
  contentPrefix: string
  contentManifest: ExerciseContentManifest
  contentCache: ExerciseContentCache
}): Promise<ExerciseContentCache> {
  const { contentPrefix, contentManifest, contentCache } = input
  const out: ExerciseContentCache = {}

  if (isS3Configured()) {
    let s3Hits = 0
    for (const file of contentManifest.files) {
      const key = `${contentPrefix}${file.path}`
      const text = await getObjectText(key)
      if (text != null) {
        out[file.path] = text
        s3Hits += 1
      } else if (contentCache[file.path] != null) {
        out[file.path] = contentCache[file.path]!
      }
    }
    if (s3Hits > 0) {
      logger.debug(
        { prefix: contentPrefix, s3Hits, total: contentManifest.files.length },
        "exercise content loaded from S3"
      )
    }
    // Fill any remaining from cache
    for (const file of contentManifest.files) {
      if (out[file.path] == null && contentCache[file.path] != null) {
        out[file.path] = contentCache[file.path]!
      }
    }
    return out
  }

  return { ...contentCache }
}

/** Upload content_cache files to S3/S3Proxy under contentPrefix. */
export async function uploadExerciseContentToS3(input: {
  contentPrefix: string
  contentManifest: ExerciseContentManifest
  contentCache: ExerciseContentCache
}): Promise<number> {
  if (!isS3Configured()) return 0
  await ensureBucket()
  let n = 0
  for (const file of input.contentManifest.files) {
    const body = input.contentCache[file.path]
    if (body == null) continue
    const key = `${input.contentPrefix}${file.path}`
    await putObject({
      key,
      body,
      contentType: file.contentType ?? "text/plain",
    })
    n += 1
  }
  return n
}
