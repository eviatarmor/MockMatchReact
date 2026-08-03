/**
 * Shared Vitest config factory for monorepo packages / apps.
 * Keeps one place for alias + include + environment conventions.
 */
import path from "node:path"
import { defineConfig, type UserConfig } from "vitest/config"

export type PackageVitestOptions = {
  /** Project name shown in reporters */
  name: string
  /** Absolute directory of the package (import.meta.dirname) */
  rootDir: string
  environment?: "node" | "jsdom"
  setupFiles?: string[]
  include?: string[]
  /** Extra resolve aliases merged after `@` → src */
  alias?: Record<string, string>
  plugins?: UserConfig["plugins"]
  /** Extra test.* overrides */
  test?: UserConfig["test"]
}

/** Unit-test config: tests/unit with @ alias to ./src. */
export function createPackageVitestConfig(opts: PackageVitestOptions) {
  const {
    name,
    rootDir,
    environment = "node",
    setupFiles,
    include = ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    alias = {},
    plugins,
    test: testOverrides,
  } = opts

  return defineConfig({
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
        ...alias,
      },
    },
    test: {
      name,
      environment,
      include,
      ...(setupFiles ? { setupFiles } : {}),
      ...testOverrides,
    },
  })
}

/** Micro-bench config: tests/bench *.bench.ts files. */
export function createPackageBenchConfig(opts: {
  name: string
  rootDir: string
  include?: string[]
  setupFiles?: string[]
  test?: UserConfig["test"]
}) {
  const {
    name,
    rootDir,
    include = ["tests/bench/**/*.bench.ts"],
    setupFiles,
    test: testOverrides,
  } = opts

  return defineConfig({
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "./src"),
      },
    },
    test: {
      name,
      environment: "node",
      ...(setupFiles ? { setupFiles } : {}),
      benchmark: {
        include,
        reporters: ["verbose"],
      },
      ...testOverrides,
    },
  })
}
