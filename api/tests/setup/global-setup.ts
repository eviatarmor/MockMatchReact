/**
 * Vitest globalSetup for integration tests.
 * Prefer Testcontainers; fall back to USE_EXISTING_INFRA=1 + env URLs.
 */
import { writeFileSync, unlinkSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { config as loadDotenv } from "dotenv"
import pg from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"

const here = dirname(fileURLToPath(import.meta.url))
// Load api/.env so USE_EXISTING_INFRA can pick DATABASE_URL / REDIS_URL
loadDotenv({ path: resolve(here, "../../.env") })
const statePath = resolve(here, ".testcontainers-state.json")
const migrationsFolder = resolve(here, "../../src/db/migrations")

type State = {
  available: boolean
  databaseUrl?: string
  redisUrl?: string
  mode?: "testcontainers" | "existing" | "unavailable"
  reason?: string
}

let stopContainers: (() => Promise<void>) | null = null

async function runMigrations(databaseUrl: string): Promise<void> {
  const pool = new pg.Pool({ connectionString: databaseUrl })
  try {
    const db = drizzle(pool)
    await migrate(db, { migrationsFolder })
  } finally {
    await pool.end()
  }
}

function writeState(state: State): void {
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8")
}

export async function setup(): Promise<void> {
  // Explicit host infra (docker-compose already up).
  if (process.env.USE_EXISTING_INFRA === "1") {
    const databaseUrl = process.env.DATABASE_URL
    const redisUrl = process.env.REDIS_URL
    if (!databaseUrl || !redisUrl) {
      writeState({
        available: false,
        mode: "unavailable",
        reason:
          "USE_EXISTING_INFRA=1 requires DATABASE_URL and REDIS_URL",
      })
      return
    }
    try {
      await runMigrations(databaseUrl)
      writeState({
        available: true,
        databaseUrl,
        redisUrl,
        mode: "existing",
      })
    } catch (err) {
      writeState({
        available: false,
        mode: "unavailable",
        reason: `Existing infra migrate failed: ${String(err)}`,
      })
    }
    return
  }

  try {
    const { PostgreSqlContainer } = await import("@testcontainers/postgresql")
    const { RedisContainer } = await import("@testcontainers/redis")

    const pgContainer = await new PostgreSqlContainer(
      "pgvector/pgvector:pg16"
    )
      .withDatabase("mockmatch")
      .withUsername("mockmatch")
      .withPassword("mockmatch")
      .start()

    const redisContainer = await new RedisContainer("redis:7-alpine").start()

    const databaseUrl = pgContainer.getConnectionUri()
    const redisUrl = redisContainer.getConnectionUrl()

    // Enable pgvector if image provides it (init may be empty).
    const pool = new pg.Pool({ connectionString: databaseUrl })
    try {
      await pool.query("CREATE EXTENSION IF NOT EXISTS vector")
    } catch {
      // Extension optional for most auth/billing tests.
    } finally {
      await pool.end()
    }

    await runMigrations(databaseUrl)

    writeState({
      available: true,
      databaseUrl,
      redisUrl,
      mode: "testcontainers",
    })

    stopContainers = async () => {
      await Promise.allSettled([pgContainer.stop(), redisContainer.stop()])
    }
  } catch (err) {
    writeState({
      available: false,
      mode: "unavailable",
      reason: `Testcontainers failed (Docker access?): ${String(err)}`,
    })
  }
}

export async function teardown(): Promise<void> {
  if (stopContainers) {
    await stopContainers()
    stopContainers = null
  }
  if (existsSync(statePath)) {
    try {
      unlinkSync(statePath)
    } catch {
      // ignore
    }
  }
}
