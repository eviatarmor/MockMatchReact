import { createPackageBenchConfig } from "../../tools/vitest/create-config.ts"

export default createPackageBenchConfig({
  name: "schemas-bench",
  rootDir: import.meta.dirname,
})
