import { createPackageVitestConfig } from "../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "api-unit",
  rootDir: import.meta.dirname,
  include: ["tests/unit/**/*.{test,spec}.ts"],
  setupFiles: ["./tests/setup/setup-env.ts"],
  test: {
    pool: "forks",
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
})
