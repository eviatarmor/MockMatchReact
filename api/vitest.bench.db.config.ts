import { createPackageBenchConfig } from "../tools/vitest/create-config.ts"

/** DB/Redis/HTTP benches — same infra as integration tests. */
export default createPackageBenchConfig({
  name: "api-bench-db",
  rootDir: import.meta.dirname,
  include: ["tests/bench/db/**/*.bench.ts"],
  setupFiles: ["./tests/setup/setup-env.ts"],
  test: {
    globalSetup: ["./tests/setup/global-setup.ts"],
    pool: "forks",
    fileParallelism: false,
    hookTimeout: 180_000,
  },
})
