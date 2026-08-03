import { createPackageVitestConfig } from "../../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "schemas",
  rootDir: import.meta.dirname,
})
