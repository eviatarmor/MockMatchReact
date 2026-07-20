import { Worker, type Job } from "bullmq"
import { getRedis } from "../../lib/redis.js"
import { logger } from "../../lib/logger.js"
import type { DomainEvent } from "../../events/types.js"
import { QUEUE_NAMES } from "../queues.js"

async function handleJob(job: Job<DomainEvent>): Promise<void> {
  const event = job.data
  logger.info(
    { queue: job.queueName, type: event.type, jobId: job.id },
    "job received (stub — no handler logic yet)"
  )
}

export function startWorkers(): Worker[] {
  const connection = getRedis()

  const workers = [
    new Worker(QUEUE_NAMES.default, handleJob, { connection }),
    new Worker(QUEUE_NAMES.email, handleJob, { connection }),
    new Worker(QUEUE_NAMES.indexing, handleJob, { connection }),
  ]

  for (const worker of workers) {
    worker.on("failed", (job, error) => {
      logger.error(
        { err: error, jobId: job?.id, queue: worker.name },
        "worker job failed"
      )
    })
  }

  logger.info(
    { queues: Object.values(QUEUE_NAMES) },
    "bullmq workers started"
  )

  return workers
}
