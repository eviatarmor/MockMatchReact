import react from "@vitejs/plugin-react"
import { createPackageVitestConfig } from "../../tools/vitest/create-config.ts"

export default createPackageVitestConfig({
  name: "ui",
  rootDir: import.meta.dirname,
  environment: "jsdom",
  setupFiles: ["../../tools/vitest/setup-jsdom.ts"],
  plugins: [react()],
})
