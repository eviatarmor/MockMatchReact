import { createPackageVitestConfig } from "../../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "browser-runner",
  rootDir: import.meta.dirname,
})
