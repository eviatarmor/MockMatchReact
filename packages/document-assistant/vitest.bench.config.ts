import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    name: "document-assistant-bench",
    environment: "jsdom",
    benchmark: {
      include: ["tests/bench/**/*.bench.ts"],
      reporters: ["verbose"],
    },
  },
})
