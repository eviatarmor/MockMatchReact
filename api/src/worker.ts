import { logger } from "./lib/logger.js"
import { closeRedis } from "./lib/redis.js"
import { closeDb } from "./db/client.js"
import { startWorkers } from "./jobs/workers/index.js"

const workers = startWorkers()

async function shutdown(signal: string) {
  logger.info({ signal }, "worker shutting down")
  await Promise.all(workers.map((worker) => worker.close()))
  await closeRedis()
  await closeDb()
  process.exit(0)
}

process.on("SIGINT", () => {
  void shutdown("SIGINT")
})
process.on("SIGTERM", () => {
  void shutdown("SIGTERM")
})

logger.info("worker process ready")
