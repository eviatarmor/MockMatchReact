import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    name: "schemas-bench",
    environment: "node",
    benchmark: {
      include: ["tests/bench/**/*.bench.ts"],
      reporters: ["verbose"],
    },
  },
})
