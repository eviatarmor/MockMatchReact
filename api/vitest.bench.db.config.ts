import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * DB/Redis-backed benchmarks — real Postgres via Testcontainers
 * (or USE_EXISTING_INFRA=1 + DATABASE_URL/REDIS_URL).
 *
 * Not pure CPU micro-benches: measures service + SQL (+ Redis) on local Docker.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    name: "api-bench-db",
    environment: "node",
    globalSetup: ["./tests/setup/global-setup.ts"],
    setupFiles: ["./tests/setup/setup-env.ts"],
    pool: "forks",
    fileParallelism: false,
    hookTimeout: 180_000,
    benchmark: {
      include: ["tests/bench/db/**/*.bench.ts"],
      reporters: ["verbose"],
    },
  },
})
