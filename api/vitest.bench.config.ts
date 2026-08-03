import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * Micro-benchmarks for hot paths (path-ops, crypto, embeddings math).
 * Run: npm run test:bench --workspace=@mockmatch/api
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    name: "api-bench",
    environment: "node",
    setupFiles: ["./tests/setup/setup-env.ts"],
    benchmark: {
      include: ["tests/bench/**/*.bench.ts"],
      reporters: ["verbose"],
    },
  },
})
