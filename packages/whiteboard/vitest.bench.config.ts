import { createPackageBenchConfig } from "../../tools/vitest/create-config.ts"

export default createPackageBenchConfig({
  name: "whiteboard-bench",
  rootDir: import.meta.dirname,
})
