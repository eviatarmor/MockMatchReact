import { Queue } from "bullmq"
import { getRedis } from "../lib/redis.js"
import { EVENT_QUEUE_MAP, QUEUE_NAMES, type QueueName } from "../jobs/queues.js"
import type { EventBus } from "./bus.js"
import type { DomainEvent } from "./types.js"

const queues = new Map<QueueName, Queue>()

function getQueue(name: QueueName): Queue {
  let queue = queues.get(name)
  if (!queue) {
    queue = new Queue(name, { connection: getRedis() })
    queues.set(name, queue)
  }
  return queue
}

export function createBullMqEventBus(): EventBus {
  return {
    async publish(event: DomainEvent) {
      const queueName = EVENT_QUEUE_MAP[event.type] ?? QUEUE_NAMES.default
      const queue = getQueue(queueName)
      await queue.add(event.type, event, {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      })
    },
  }
}

export async function closeQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((queue) => queue.close()))
  queues.clear()
}
