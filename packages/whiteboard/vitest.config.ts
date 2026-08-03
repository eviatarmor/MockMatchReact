import { createPackageVitestConfig } from "../../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "whiteboard",
  rootDir: import.meta.dirname,
})
