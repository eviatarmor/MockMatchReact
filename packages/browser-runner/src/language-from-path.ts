import type { RuntimeLanguage } from "./types"

const EXT_MAP: Record<string, RuntimeLanguage> = {
  ".py": "python",
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".hpp": "cpp",
  ".hh": "cpp",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".cs": "csharp",
  ".tsx": "typescript",
  ".jsx": "javascript",
}

/**
 * Infer runtime language from a file path.
 * React/TSX maps to typescript (transpile) until nodejs/web engine exists.
 */
export function languageFromPath(path: string): RuntimeLanguage | null {
  const base = path.includes("/")
    ? path.slice(path.lastIndexOf("/") + 1)
    : path
  const dot = base.lastIndexOf(".")
  if (dot < 0) return null
  const ext = base.slice(dot).toLowerCase()
  return EXT_MAP[ext] ?? null
}

/** True when the path looks like a Node/web app entry (not pure algorithm JS). */
export function looksLikeWebAppEntry(path: string, files: Record<string, string>): boolean {
  if (path.endsWith(".tsx") || path.endsWith(".jsx")) return true
  if ("package.json" in files) {
    try {
      const pkg = JSON.parse(files["package.json"] ?? "{}") as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      }
      if (deps.react || deps.vue || deps["@angular/core"] || deps.next) {
        return true
      }
    } catch {
      // ignore
    }
  }
  return false
}
