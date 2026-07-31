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
  // Browser-runner: esbuild-wasm + Pyodide CDN + Runno clang
  optimizeDeps: {
    exclude: ["esbuild-wasm", "@runno/runtime", "@runno/wasi"],
  },
  server: {
    // Allow dynamic import of Pyodide from jsDelivr
    fs: {
      allow: [".."],
    },
    // C/C++ (Runno) needs SharedArrayBuffer → cross-origin isolation
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
})
