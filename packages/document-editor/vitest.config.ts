import { createPackageVitestConfig } from "../../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "document-editor",
  rootDir: import.meta.dirname,
})
