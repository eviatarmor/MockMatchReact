import type { SandboxMode } from "./types.js"
import { safeRelPath } from "./files.js"

function pickEntry(
  files: Record<string, string>,
  entryPath?: string
): string | null {
  if (entryPath) {
    const safe = safeRelPath(entryPath)
    if (safe && files[safe] != null) return safe
  }
  const preferred = [
    "src/index.ts",
    "src/main.ts",
    "src/index.js",
    "src/main.js",
    "index.ts",
    "main.ts",
    "index.js",
    "main.js",
    "main.py",
    "app.py",
    "solution/solution.ts",
    "solution/solution.js",
    "solution/solution.py",
  ]
  for (const p of preferred) {
    if (files[p] != null) return p
  }
  const keys = Object.keys(files).sort()
  for (const k of keys) {
    if (/\.(ts|tsx|js|mjs|cjs|py|sh)$/i.test(k)) return k
  }
  return keys[0] ?? null
}

export function buildSandboxCommand(
  mode: SandboxMode,
  files: Record<string, string>,
  entryPath?: string
): { argv: string[]; label: string } | { error: string } {
  if (mode === "tests") {
    const pkg = files["package.json"]
    if (pkg) {
      try {
        const json = JSON.parse(pkg) as { scripts?: Record<string, string> }
        if (json.scripts?.test?.trim()) {
          const script = json.scripts.test.trim()
          return { argv: ["bash", "-lc", script], label: `test: ${script}` }
        }
      } catch {
        // fall through
      }
    }
    const testFiles = Object.keys(files)
      .filter(
        (p) =>
          /\.(test|spec)\.(ts|tsx|js|mjs|cjs)$/i.test(p) ||
          /tests?\.(ts|js)$/i.test(p)
      )
      .sort()
    if (testFiles.length > 0) {
      const first = testFiles[0]!
      const args = testFiles.map((f) => JSON.stringify(f)).join(" ")
      if (/\.tsx?$/i.test(first)) {
        return {
          argv: [
            "bash",
            "-lc",
            `node --experimental-strip-types --test ${args}`,
          ],
          label: `node --test (${testFiles.length} file(s))`,
        }
      }
      return {
        argv: ["bash", "-lc", `node --test ${args}`],
        label: `node --test (${testFiles.length} file(s))`,
      }
    }
    const pyTests = Object.keys(files).filter(
      (p) => /test_.*\.py$/i.test(p) || /_test\.py$/i.test(p)
    )
    if (pyTests.length > 0) {
      return {
        argv: [
          "python3",
          "-m",
          "unittest",
          "discover",
          "-s",
          ".",
          "-p",
          "*test*.py",
          "-v",
        ],
        label: "python3 -m unittest",
      }
    }
    return {
      error:
        "No tests found (add package.json scripts.test, *.test.ts, or test_*.py).",
    }
  }

  const pkg = files["package.json"]
  if (pkg) {
    try {
      const json = JSON.parse(pkg) as { scripts?: Record<string, string> }
      if (json.scripts?.start?.trim()) {
        const script = json.scripts.start.trim()
        return { argv: ["bash", "-lc", script], label: `start: ${script}` }
      }
    } catch {
      // fall through
    }
  }

  const entry = pickEntry(files, entryPath)
  if (!entry) return { error: "No entry file to run" }
  if (/\.py$/i.test(entry)) {
    return { argv: ["python3", entry], label: `python3 ${entry}` }
  }
  if (/\.sh$/i.test(entry)) {
    return { argv: ["bash", entry], label: `bash ${entry}` }
  }
  if (/\.tsx?$/i.test(entry)) {
    return {
      argv: ["node", "--experimental-strip-types", entry],
      label: `node ${entry}`,
    }
  }
  if (/\.(js|mjs|cjs)$/i.test(entry)) {
    return { argv: ["node", entry], label: `node ${entry}` }
  }
  return { error: `Cannot run file type: ${entry}` }
}
