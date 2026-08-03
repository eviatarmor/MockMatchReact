import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * API unit tests live under tests/unit (production code stays in src/).
 * Integration: vitest.integration.config.ts
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    name: "api-unit",
    environment: "node",
    include: ["tests/unit/**/*.{test,spec}.ts"],
    setupFiles: ["./tests/setup/setup-env.ts"],
    pool: "forks",
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
})
