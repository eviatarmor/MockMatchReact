import path from "node:path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

/**
 * Client unit tests under tests/unit (production code stays in src/).
 * E2E: tests/e2e via Playwright.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@mockmatch/api/router": path.resolve(
        import.meta.dirname,
        "../api/src/trpc/index.ts"
      ),
    },
  },
  test: {
    name: "client",
    environment: "jsdom",
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./tests/setup/setup.ts"],
    css: false,
    globals: false,
  },
})
