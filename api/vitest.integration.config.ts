import { createPackageVitestConfig } from "../tools/vitest/create-config.ts"

/**
 * API integration — Postgres + Redis via Testcontainers (or USE_EXISTING_INFRA=1).
 * Set REQUIRE_INTEGRATION=1 (CI) to fail instead of skip when infra is unavailable.
 */
export default createPackageVitestConfig({
  name: "api-integration",
  rootDir: import.meta.dirname,
  include: ["tests/integration/**/*.{test,spec}.ts"],
  setupFiles: ["./tests/setup/setup-env.ts"],
  test: {
    globalSetup: ["./tests/setup/global-setup.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
