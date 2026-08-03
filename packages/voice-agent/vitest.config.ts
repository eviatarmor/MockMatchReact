import { createPackageVitestConfig } from "../../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "voice-agent",
  rootDir: import.meta.dirname,
})
