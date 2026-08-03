import { createPackageVitestConfig } from "../../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "document-assistant",
  rootDir: import.meta.dirname,
  // stripHtml uses DOMParser
  environment: "jsdom",
})
