import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Scan monorepo packages for Tailwind @source + linked @mockmatch/ui
  server: {
    port: 5180,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
  },
  build: {
    rollupOptions: {
      input: {
        panel: path.resolve(__dirname, "index.html"),
        chip: path.resolve(__dirname, "chip.html"),
        background: path.resolve(__dirname, "src/background.ts"),
        content: path.resolve(__dirname, "src/content.ts"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background" || chunk.name === "content") {
            return "[name].js"
          }
          return "assets/[name]-[hash].js"
        },
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
})
