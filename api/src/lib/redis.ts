import { Redis } from "ioredis"
import { env } from "../config/env.js"
import { logger } from "./logger.js"

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })

    redis.on("error", (error) => {
      logger.error({ err: error }, "redis error")
    })
  }

  return redis
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}
