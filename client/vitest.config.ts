import path from "node:path"
import react from "@vitejs/plugin-react"
import { createPackageVitestConfig } from "../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "client",
  rootDir: import.meta.dirname,
  environment: "jsdom",
  setupFiles: ["./tests/setup/setup.ts"],
  plugins: [react()],
  alias: {
    "@mockmatch/api/router": path.resolve(
      import.meta.dirname,
      "../api/src/trpc/index.ts"
    ),
  },
  test: {
    css: false,
    globals: false,
  },
})
