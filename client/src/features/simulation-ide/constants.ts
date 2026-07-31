import type { IdeTab, IdeTreeNode } from "@mockmatch/ide"
import type { IdeFormatPreset, IdeFormatSlug } from "./types"
import { documentFromTabs } from "./lib/parse-workspace-document"
import { sortTreeDeep } from "./lib/tree-ops"

export const IDE_FORMAT_PRESETS: Record<IdeFormatSlug, IdeFormatPreset> = {
  react: {
    slug: "react",
    trackFormat: "workspace",
    treeEnabled: true,
    defaultShowTree: true,
    defaultShowTerminal: false,
    layout: "ide",
    openSeedTabs: true,
    tabsClosable: true,
    titleKey: "formats.react.title",
    descriptionKey: "formats.react.description",
    badgeKey: "formats.react.badge",
    runtime: { language: "nodejs", entryPath: "src/main.tsx" },
  },
  "cpp-sort": {
    slug: "cpp-sort",
    trackFormat: "codeRun",
    treeEnabled: false,
    defaultShowTree: false,
    defaultShowTerminal: false,
    layout: "editor",
    openSeedTabs: true,
    tabsClosable: false,
    titleKey: "formats.cppSort.title",
    descriptionKey: "formats.cppSort.description",
    badgeKey: "formats.cppSort.badge",
    runtime: { language: "cpp", entryPath: "sort.cpp" },
  },
  "js-sum": {
    slug: "js-sum",
    trackFormat: "codeRun",
    treeEnabled: false,
    defaultShowTree: false,
    defaultShowTerminal: true,
    layout: "editor",
    openSeedTabs: true,
    tabsClosable: false,
    titleKey: "formats.jsSum.title",
    descriptionKey: "formats.jsSum.description",
    badgeKey: "formats.jsSum.badge",
    runtime: { language: "javascript", entryPath: "sum.js" },
  },
  "ts-sum": {
    slug: "ts-sum",
    trackFormat: "codeRun",
    treeEnabled: false,
    defaultShowTree: false,
    defaultShowTerminal: true,
    layout: "editor",
    openSeedTabs: true,
    tabsClosable: false,
    titleKey: "formats.tsSum.title",
    descriptionKey: "formats.tsSum.description",
    badgeKey: "formats.tsSum.badge",
    runtime: { language: "typescript", entryPath: "sum.ts" },
  },
  "py-hello": {
    slug: "py-hello",
    trackFormat: "codeRun",
    treeEnabled: false,
    defaultShowTree: false,
    defaultShowTerminal: true,
    layout: "editor",
    openSeedTabs: true,
    tabsClosable: false,
    titleKey: "formats.pyHello.title",
    descriptionKey: "formats.pyHello.description",
    badgeKey: "formats.pyHello.badge",
    runtime: { language: "python", entryPath: "main.py" },
  },
  shell: {
    slug: "shell",
    trackFormat: "terminal",
    treeEnabled: false,
    defaultShowTree: false,
    defaultShowTerminal: true,
    layout: "shell",
    openSeedTabs: false,
    tabsClosable: true,
    titleKey: "formats.shell.title",
    descriptionKey: "formats.shell.description",
    badgeKey: "formats.shell.badge",
  },
  /** Durable multiplayer room (share links) — not a catalog exercise starter. */
  workspace: {
    slug: "workspace",
    trackFormat: "workspace",
    treeEnabled: true,
    defaultShowTree: true,
    defaultShowTerminal: true,
    layout: "ide",
    openSeedTabs: false,
    tabsClosable: true,
    titleKey: "formats.workspace.title",
    descriptionKey: "formats.workspace.description",
    badgeKey: "formats.workspace.badge",
  },
}

// ── React multi-file IDE exercise ───────────────────────────────────────────

const REACT_TREE_RAW: IdeTreeNode[] = [
  {
    id: "src",
    name: "src",
    children: [
      { id: "src/main.tsx", name: "main.tsx" },
      { id: "src/App.tsx", name: "App.tsx" },
      {
        id: "src/components",
        name: "components",
        children: [{ id: "src/components/Counter.tsx", name: "Counter.tsx" }],
      },
    ],
  },
  { id: "package.json", name: "package.json" },
  { id: "README.md", name: "README.md" },
]

export const REACT_TREE: IdeTreeNode[] = sortTreeDeep(REACT_TREE_RAW)

export const REACT_TABS: IdeTab[] = [
  {
    id: "src/App.tsx",
    title: "App.tsx",
    language: "typescript",
    value: `import { Counter } from "./components/Counter"

/**
 * Exercise: React counter
 * -----------------------
 * Wire Counter so the page shows a live count with + / − buttons.
 * Keep the layout simple — no router or state library required.
 */
export default function App() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Counter lab</h1>
      <p>Implement Counter and mount it here.</p>
      {/* <Counter /> */}
    </main>
  )
}
`,
  },
  {
    id: "src/components/Counter.tsx",
    title: "Counter.tsx",
    language: "typescript",
    value: `import { useState } from "react"

/**
 * TODO:
 * - Track count with useState (start at 0)
 * - Increment / decrement buttons
 * - Disable decrement at 0 (optional polish)
 */
export function Counter() {
  // const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: ?</p>
      <button type="button">−</button>
      <button type="button">+</button>
    </div>
  )
}
`,
  },
  {
    id: "src/main.tsx",
    title: "main.tsx",
    language: "typescript",
    value: `import { createRoot } from "react-dom/client"
import App from "./App"

const root = document.getElementById("root")
if (root) {
  createRoot(root).render(<App />)
}
`,
  },
  {
    id: "package.json",
    title: "package.json",
    language: "json",
    value: `{
  "name": "react-counter-lab",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
`,
  },
  {
    id: "README.md",
    title: "README.md",
    language: "markdown",
    value: `# React · Counter lab

Build a small counter UI with React hooks.

1. Finish \`Counter.tsx\` (state + buttons).
2. Render \`<Counter />\` from \`App.tsx\`.
3. Optional: reset button, step size, or keyboard shortcuts.

No judge is connected — focus on structure and component design.
`,
  },
]

export const REACT_DEFAULT_EXPANDED = ["src", "src/components"]

// ── C++ sort (Monaco only) ──────────────────────────────────────────────────

export const CPP_SORT_TABS: IdeTab[] = [
  {
    id: "sort.cpp",
    title: "sort.cpp",
    language: "cpp",
    value: `// Exercise: sort an array of integers (ascending).
// Implement sortInts in-place. Any correct algorithm is fine
// (bubble, insertion, quicksort, …).
// C++ client runner (WASI/clang) is next — Run shows status for now.

#include <iostream>
#include <vector>

void sortInts(std::vector<int>& a) {
  // TODO: sort a ascending
  (void)a;
}

int main() {
  std::vector<int> nums = {5, 1, 4, 2, 8};
  sortInts(nums);
  for (int x : nums) {
    std::cout << x << ' ';
  }
  std::cout << '\\n';
  return 0;
}
`,
  },
]

// ── JavaScript sum (browser-runner demo) ────────────────────────────────────

export const JS_SUM_TABS: IdeTab[] = [
  {
    id: "sum.js",
    title: "sum.js",
    language: "javascript",
    value: `// Exercise: sum numbers from stdin (one integer per line; blank line ends).
// Client-side runner — console.log goes to the IDE terminal.
// Helpers: readStdin(), readline(), process.stdout.write(...)

function sumLines(text) {
  let total = 0
  for (const line of text.split("\\n")) {
    const t = line.trim()
    if (!t) continue
    const n = Number(t)
    if (!Number.isNaN(n)) total += n
  }
  return total
}

// Demo input when stdin is empty
const sample = "1\\n2\\n3\\n"
const input = readStdin().trim() ? readStdin() : sample
console.log(sumLines(input))
`,
  },
]

export const TS_SUM_TABS: IdeTab[] = [
  {
    id: "sum.ts",
    title: "sum.ts",
    language: "typescript",
    value: `// Exercise: sum numbers (TypeScript).
// Client-side: esbuild-wasm strips types, then runs as JS.
// Helpers: readStdin(), readline(), process.stdout.write(...)

function sumLines(text: string): number {
  let total = 0
  for (const line of text.split("\\n")) {
    const t = line.trim()
    if (!t) continue
    const n = Number(t)
    if (!Number.isNaN(n)) total += n
  }
  return total
}

const sample = "1\\n2\\n3\\n"
const input = readStdin().trim() ? readStdin() : sample
console.log(sumLines(input))
`,
  },
]

export const PY_HELLO_TABS: IdeTab[] = [
  {
    id: "main.py",
    title: "main.py",
    language: "python",
    value: `# Exercise: sum integers from stdin (one per line).
# Client-side Python via Pyodide — print() goes to the IDE terminal.
# First run downloads the Python WASM runtime (~10MB+, then cached).

import sys

def sum_lines(text: str) -> int:
    total = 0
    for line in text.splitlines():
        t = line.strip()
        if not t:
            continue
        try:
            total += int(t)
        except ValueError:
            pass
    return total

sample = "1\\n2\\n3\\n"
raw = sys.stdin.read()
text = raw if raw.strip() else sample
print(sum_lines(text))
`,
  },
]

// ── Shell lab ───────────────────────────────────────────────────────────────

export const SHELL_WELCOME = `Ops shell lab — incident drill (no remote host).

Scenario: API latency spiked after a deploy. Explore the fake workspace
with the commands below, then decide what you would restart or roll back.

Commands: help · ls · cat deploy.log · cat status.txt · clear
`

export const SHELL_CWD = "~/incident-42"

/** Local line-mode shell for the terminal exercise (virtual FS from catalog). */
export function shellExerciseCommand(
  command: string,
  opts?: { cwd?: string; files?: Record<string, string> }
): string[] {
  const cwd = opts?.cwd ?? SHELL_CWD
  const files = opts?.files ?? {}
  const names = Object.keys(files)
  const cmd = command.trim()
  if (!cmd) return []

  if (cmd === "help") {
    return [
      "Available: help, ls, cat <file>, pwd, clear, whoami",
      names.length
        ? `Files: ${names.join(", ")}`
        : "Hint: start with ls, then cat deploy.log",
    ]
  }
  if (cmd === "pwd") return [cwd]
  if (cmd === "whoami") return ["oncall"]
  if (cmd === "ls" || cmd === "ls -la") {
    return [names.length ? names.join("  ") : "(empty)"]
  }
  if (cmd.startsWith("cat ")) {
    const name = cmd.slice(4).trim().replace(/^\.\//, "")
    const body = files[name]
    if (body == null) {
      return [`cat: ${name}: No such file or directory`]
    }
    return body.replace(/\r\n/g, "\n").split("\n")
  }
  return [`command not found: ${cmd.split(/\s+/)[0] ?? cmd}`]
}

// ── Collab workspace seeds (shareable multiplayer room) ─────────────────────

const WORKSPACE_TREE_RAW: IdeTreeNode[] = [
  {
    id: "src",
    name: "src",
    children: [
      { id: "src/index.ts", name: "index.ts" },
      { id: "src/app.ts", name: "app.ts" },
      {
        id: "src/lib",
        name: "lib",
        children: [
          { id: "src/lib/utils.ts", name: "utils.ts" },
          { id: "src/lib/utils.test.ts", name: "utils.test.ts" },
        ],
      },
    ],
  },
  { id: "package.json", name: "package.json" },
  { id: "README.md", name: "README.md" },
]

export const WORKSPACE_TREE: IdeTreeNode[] = sortTreeDeep(WORKSPACE_TREE_RAW)

export const WORKSPACE_TABS: IdeTab[] = [
  {
    id: "src/index.ts",
    title: "index.ts",
    language: "typescript",
    value: `import { createApp } from "./app"

const app = createApp()
app.listen(3000, () => {
  console.log("workspace ready — multiplayer collab IDE")
})
`,
  },
  {
    id: "src/app.ts",
    title: "app.ts",
    language: "typescript",
    value: `export function createApp() {
  return {
    listen(port: number, cb: () => void) {
      void port
      cb()
    },
  }
}
`,
  },
  {
    id: "src/lib/utils.ts",
    title: "utils.ts",
    language: "typescript",
    value: `export function assertDefined<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Expected value")
  return value
}

export function add(a: number, b: number): number {
  return a + b
}
`,
  },
  {
    id: "src/lib/utils.test.ts",
    title: "utils.test.ts",
    language: "typescript",
    value: `import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { add, assertDefined } from "./utils.ts"

describe("utils", () => {
  it("adds", () => {
    assert.equal(add(2, 3), 5)
  })
  it("assertDefined", () => {
    assert.equal(assertDefined(1), 1)
  })
})
`,
  },
  {
    id: "package.json",
    title: "package.json",
    language: "json",
    value: `{
  "name": "workspace-preview",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node --experimental-strip-types src/index.ts",
    "test": "node --experimental-strip-types --test src/lib/utils.test.ts"
  }
}
`,
  },
  {
    id: "README.md",
    title: "README.md",
    language: "markdown",
    value: `# Dev workspace

Multiplayer IDE with live collab (Yjs, presence, share links).
`,
  },
]

export const WORKSPACE_DEFAULT_EXPANDED = ["src", "src/lib"]

export function tabsForFormat(slug: IdeFormatSlug): IdeTab[] {
  switch (slug) {
    case "react":
      return REACT_TABS
    case "cpp-sort":
      return CPP_SORT_TABS
    case "js-sum":
      return JS_SUM_TABS
    case "ts-sum":
      return TS_SUM_TABS
    case "py-hello":
      return PY_HELLO_TABS
    case "shell":
      return []
    case "workspace":
      return WORKSPACE_TABS
  }
}

export function treeForFormat(slug: IdeFormatSlug): IdeTreeNode[] {
  switch (slug) {
    case "react":
      return REACT_TREE
    case "workspace":
      return WORKSPACE_TREE
    case "cpp-sort":
    case "js-sum":
    case "ts-sum":
    case "py-hello":
    case "shell":
      return []
  }
}

export function defaultExpandedForFormat(slug: IdeFormatSlug): string[] {
  switch (slug) {
    case "react":
      return REACT_DEFAULT_EXPANDED
    case "workspace":
      return WORKSPACE_DEFAULT_EXPANDED
    default:
      return []
  }
}

export const CODE_RUN_BASE_PATH = "/simulations/code-run"
/** Freeform multi-file collab IDE (not under code-run). */
export const WORKSPACE_BASE_PATH = "/simulations/workspace"
/** Shell-only terminal lab. */
export const TERMINAL_LAB_BASE_PATH = "/simulations/terminal-lab"

/** App path for a practice format (share links + create redirect). */
export function pathForFormat(slug: IdeFormatSlug): string {
  if (slug === "workspace") return WORKSPACE_BASE_PATH
  if (slug === "shell") return TERMINAL_LAB_BASE_PATH
  return `${CODE_RUN_BASE_PATH}/${slug}`
}

/** Seed durable document blob for a practice format. */
export function seedDocumentForFormat(slug: IdeFormatSlug) {
  return documentFromTabs(treeForFormat(slug), tabsForFormat(slug))
}

/** Catalog track id → practice path (null = not a code-run exercise). */
export function idePathForTrackId(trackId: string): string | null {
  switch (trackId) {
    case "live-coding":
      return pathForFormat("react")
    case "technical-coding":
      return pathForFormat("cpp-sort")
    case "ops-terminal":
      return pathForFormat("shell")
    default:
      return null
  }
}
