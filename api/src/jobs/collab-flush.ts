import { Queue } from "bullmq"
import type { DocumentKind } from "@mockmatch/schemas"
import { db } from "../db/client.js"
import {
  collabFlushDelayMs,
  flushJobId,
  getSnapshot,
  isDirty,
  markFlushed,
} from "../lib/collab-store.js"
import { getRedis } from "../lib/redis.js"
import { logger } from "../lib/logger.js"
import { persistDocumentSnapshot } from "../modules/collab/service.js"
import { QUEUE_NAMES, type CollabFlushJob } from "./queues.js"

let collabQueue: Queue<CollabFlushJob> | null = null

export function getCollabQueue(): Queue<CollabFlushJob> {
  if (!collabQueue) {
    collabQueue = new Queue<CollabFlushJob>(QUEUE_NAMES.collab, {
      connection: getRedis(),
    })
  }
  return collabQueue
}

/** Debounced Postgres flush — same jobId collapses rapid edits. */
export async function scheduleCollabFlush(
  kind: DocumentKind,
  documentId: string,
  opts?: { immediate?: boolean }
): Promise<void> {
  const queue = getCollabQueue()
  const jobId = flushJobId(kind, documentId)
  const existing = await queue.getJob(jobId)
  if (existing) {
    try {
      await existing.remove()
    } catch {
      // may already be active
    }
  }
  await queue.add(
    "flush",
    { kind, documentId },
    {
      jobId,
      delay: opts?.immediate ? 0 : collabFlushDelayMs(),
      removeOnComplete: 100,
      removeOnFail: 500,
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
    }
  )
}

export async function runCollabFlush(
  kind: DocumentKind,
  documentId: string
): Promise<void> {
  if (!(await isDirty(kind, documentId))) {
    logger.debug({ kind, documentId }, "collab flush skipped — not dirty")
    return
  }
  const snap = await getSnapshot(kind, documentId)
  if (!snap) {
    logger.warn({ kind, documentId }, "collab flush skipped — no snapshot")
    return
  }
  if (snap.rev <= snap.flushedRev) {
    return
  }

  await persistDocumentSnapshot(db, kind, documentId, snap.ownerUserId, {
    title: snap.title,
    templateId: snap.templateId,
    style: snap.style,
    document: snap.document,
  })

  await markFlushed(kind, documentId, snap.rev)
  logger.info(
    { kind, documentId, rev: snap.rev },
    "collab snapshot flushed to postgres"
  )
}
