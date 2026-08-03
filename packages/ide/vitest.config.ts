import { createPackageVitestConfig } from "../../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "ide",
  rootDir: import.meta.dirname,
})
