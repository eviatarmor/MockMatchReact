/**
 * Runs before every API test file. Sets process.env so config/env.ts can parse.
 * Integration globalSetup may overwrite DATABASE_URL / REDIS_URL via state file.
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const statePath = resolve(here, ".testcontainers-state.json")

process.env.NODE_ENV ??= "test"
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-min-8-chars"
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-min-8-chars"
process.env.OTP_STUB_CODE ??= "000000"
process.env.OTP_TTL_MINUTES ??= "10"
process.env.OTP_MAX_ATTEMPTS ??= "5"
process.env.APP_URL ??= "http://localhost:5173"
process.env.API_URL ??= "http://localhost:3000"
process.env.WS_URL ??= "ws://localhost:3001"
process.env.LOG_LEVEL ??= "silent"
// Force free tier in tests so collab paid-gate cases are meaningful
// (api/.env often sets FREE_CREDIT_GRANT=100 for local collab UX).
process.env.FREE_CREDIT_GRANT = "0"

// Placeholders for unit tests; integration globalSetup replaces when available.
process.env.DATABASE_URL ??=
  "postgresql://mockmatch:mockmatch@127.0.0.1:5432/mockmatch"
process.env.REDIS_URL ??= "redis://127.0.0.1:6379"

if (existsSync(statePath)) {
  try {
    const state = JSON.parse(readFileSync(statePath, "utf8")) as {
      available?: boolean
      databaseUrl?: string
      redisUrl?: string
    }
    if (state.available && state.databaseUrl && state.redisUrl) {
      process.env.DATABASE_URL = state.databaseUrl
      process.env.REDIS_URL = state.redisUrl
      process.env.TEST_CONTAINERS_AVAILABLE = "1"
    } else {
      process.env.TEST_CONTAINERS_AVAILABLE = "0"
    }
  } catch {
    process.env.TEST_CONTAINERS_AVAILABLE = "0"
  }
}
