import { createPackageBenchConfig } from "../../tools/vitest/create-config.ts"

export default createPackageBenchConfig({
  name: "collab-bench",
  rootDir: import.meta.dirname,
})
