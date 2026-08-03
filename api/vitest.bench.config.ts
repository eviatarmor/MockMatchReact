import { createPackageBenchConfig } from "../tools/vitest/create-config.ts"

/** Pure CPU micro-benches (excludes tests/bench/db). */
export default createPackageBenchConfig({
  name: "api-bench",
  rootDir: import.meta.dirname,
  include: ["tests/bench/*.bench.ts"],
  setupFiles: ["./tests/setup/setup-env.ts"],
})
