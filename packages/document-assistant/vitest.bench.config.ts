import { createPackageBenchConfig } from "../../tools/vitest/create-config.ts"

export default createPackageBenchConfig({
  name: "document-assistant-bench",
  rootDir: import.meta.dirname,
})
