import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@mockmatch/api/router": path.resolve(
        import.meta.dirname,
        "../api/src/trpc/index.ts"
      ),
    },
  },
  // Browser-runner: esbuild-wasm + Pyodide CDN assets
  optimizeDeps: {
    exclude: ["esbuild-wasm"],
  },
  server: {
    // Allow dynamic import of Pyodide from jsDelivr
    fs: {
      allow: [".."],
    },
  },
})
