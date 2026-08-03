import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * API integration tests under tests/integration.
 * Postgres + Redis via Testcontainers (or USE_EXISTING_INFRA=1).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    name: "api-integration",
    environment: "node",
    include: ["tests/integration/**/*.{test,spec}.ts"],
    globalSetup: ["./tests/setup/global-setup.ts"],
    setupFiles: ["./tests/setup/setup-env.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
