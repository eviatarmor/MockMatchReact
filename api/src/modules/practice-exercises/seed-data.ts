import type {
  ExerciseContentCache,
  ExerciseContentManifest,
  ExerciseUiFlags,
} from "../../db/schema/practice-exercises.js"

export type ExerciseSeed = {
  slug: string
  title: string
  description: string
  prompt: string
  aiContext: string
  format: "code_run" | "workspace" | "terminal"
  layout: "ide" | "editor" | "shell"
  domain:
    | "coding"
    | "frontend"
    | "backend"
    | "devops"
    | "system_design"
    | "data"
    | "product"
    | "behavioral"
    | "finance"
    | "clinical"
    | "general"
  difficulty: "easy" | "medium" | "hard"
  languages: string[]
  roleFamilies: string[]
  tags: string[]
  durationMin: number
  uiFlags: ExerciseUiFlags
  contentVersion: string
  contentManifest: ExerciseContentManifest
  contentCache: ExerciseContentCache
}

function searchDoc(
  e: Pick<
    ExerciseSeed,
    | "title"
    | "description"
    | "prompt"
    | "aiContext"
    | "domain"
    | "difficulty"
    | "languages"
    | "tags"
    | "roleFamilies"
  >
): string {
  return [
    e.title,
    e.description,
    e.prompt,
    e.aiContext,
    e.domain,
    e.difficulty,
    e.languages.join(" "),
    e.tags.join(" "),
    e.roleFamilies.join(" "),
  ]
    .filter(Boolean)
    .join("\n")
}

const REACT_FILES: ExerciseContentCache = {
  "src/App.tsx": `import { Counter } from "./components/Counter"

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
  "src/components/Counter.tsx": `import { useState } from "react"

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
  "src/main.tsx": `import { createRoot } from "react-dom/client"
import App from "./App"

const root = document.getElementById("root")
if (root) {
  createRoot(root).render(<App />)
}
`,
  "package.json": `{
  "name": "react-counter-lab",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
`,
  "README.md": `# React · Counter lab

Build a small counter UI with React hooks.

1. Finish \`Counter.tsx\` (state + buttons).
2. Render \`<Counter />\` from \`App.tsx\`.
3. Optional: reset button, step size, or keyboard shortcuts.

No judge is connected — focus on structure and component design.
`,
}

const CPP_FILES: ExerciseContentCache = {
  "sort.cpp": `// Exercise: sort an array of integers (ascending).
// Implement sortInts in-place. Any correct algorithm is fine
// (bubble, insertion, quicksort, …). No judge is connected.

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
}

const SHELL_FILES: ExerciseContentCache = {
  "deploy.log": `[12:01:02] build ok image=api:2026.07.31-a3
[12:02:11] rollout started replicas=3
[12:03:44] WARN probe fail pod=api-7f9x  readiness timeout
[12:04:01] ERROR connection pool exhausted db=primary
[12:04:18] ERROR 503 /v1/ready upstream timeout
`,
  "status.txt": `service: api
version: 2026.07.31-a3
prev:    2026.07.30-c1  (healthy)
notes:   connection pool max lowered in last PR
`,
  "README": `Incident box — simulated only.
Goal: identify likely regression from deploy.log + status.txt.
`,
}

function filesToManifest(
  files: ExerciseContentCache,
  tree: ExerciseContentManifest["tree"]
): ExerciseContentManifest {
  return {
    tree,
    files: Object.keys(files).map((path) => ({
      path,
      language: languageFromPath(path),
      contentType: contentTypeFromPath(path),
    })),
  }
}

function languageFromPath(path: string): string {
  const ext = path.includes(".") ? path.slice(path.lastIndexOf(".") + 1) : ""
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript"
    case "js":
    case "jsx":
      return "javascript"
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp"
    case "py":
      return "python"
    case "json":
      return "json"
    case "md":
      return "markdown"
    default:
      return "plaintext"
  }
}

function contentTypeFromPath(path: string): string {
  const ext = path.includes(".") ? path.slice(path.lastIndexOf(".") + 1) : ""
  switch (ext) {
    case "json":
      return "application/json"
    case "md":
      return "text/markdown"
    case "ts":
    case "tsx":
      return "text/typescript"
    case "cpp":
      return "text/x-c++src"
    default:
      return "text/plain"
  }
}

export const EXERCISE_SEEDS: ExerciseSeed[] = [
  {
    slug: "react",
    title: "React · Counter lab",
    description:
      "Multi-file React exercise: implement a counter component with hooks in a small app tree.",
    prompt:
      "Finish Counter.tsx (useState + increment/decrement) and mount <Counter /> from App.tsx. Optional polish: disable decrement at 0, reset, or keyboard shortcuts.",
    aiContext:
      "Frontend fundamentals. Assess useState, component composition, controlled UI. Do not require a build step. Rubric: state correctness, event handlers, clean component API. Variants: step size prop, dual counters, undo stack.",
    format: "workspace",
    layout: "ide",
    domain: "frontend",
    difficulty: "easy",
    languages: ["typescript", "react"],
    roleFamilies: ["engineering"],
    tags: ["react", "hooks", "components", "ui"],
    durationMin: 25,
    uiFlags: {
      treeEnabled: true,
      defaultShowTree: true,
      defaultShowTerminal: false,
      openSeedTabs: true,
      tabsClosable: true,
      defaultOpenPaths: ["src/App.tsx", "src/components/Counter.tsx"],
      defaultExpandedIds: ["src", "src/components"],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(REACT_FILES, [
      {
        id: "src",
        name: "src",
        children: [
          { id: "src/main.tsx", name: "main.tsx" },
          { id: "src/App.tsx", name: "App.tsx" },
          {
            id: "src/components",
            name: "components",
            children: [
              { id: "src/components/Counter.tsx", name: "Counter.tsx" },
            ],
          },
        ],
      },
      { id: "package.json", name: "package.json" },
      { id: "README.md", name: "README.md" },
    ]),
    contentCache: REACT_FILES,
  },
  {
    slug: "cpp-sort",
    title: "C++ · Sort ints",
    description:
      "Single-file C++ exercise: implement an in-place ascending sort for a vector of integers.",
    prompt:
      "Implement sortInts(std::vector<int>&) to sort ascending in place. Any correct algorithm is fine (bubble, insertion, quicksort, …). main() already prints the result.",
    aiContext:
      "Classic DSA. Assess correctness, edge cases (empty, single, duplicates, already sorted), optional complexity discussion. Single file, no tree UI. Variants: descending, stable sort, custom comparator, k-th element.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "medium",
    languages: ["cpp"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "sorting", "arrays", "cpp"],
    durationMin: 30,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: false,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["sort.cpp"],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(CPP_FILES, [
      { id: "sort.cpp", name: "sort.cpp" },
    ]),
    contentCache: CPP_FILES,
  },
  {
    slug: "shell",
    title: "Ops · Shell lab",
    description:
      "Shell-only incident drill: explore logs and status to diagnose a failed deploy.",
    prompt:
      "API latency spiked after a deploy. Use the shell (help, ls, cat) to inspect deploy.log and status.txt. Decide what you would restart or roll back and why.",
    aiContext:
      "DevOps / SRE incident response. Assess log reading, hypothesis formation, rollback vs restart. Virtual FS only (no real host). Variants: different log patterns, network vs DB root cause, runbook steps.",
    format: "terminal",
    layout: "shell",
    domain: "devops",
    difficulty: "medium",
    languages: ["shell"],
    roleFamilies: ["engineering"],
    tags: ["devops", "sre", "incident", "logs", "shell"],
    durationMin: 40,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: false,
      tabsClosable: true,
      shellWelcome: `Ops shell lab — incident drill (no remote host).

Scenario: API latency spiked after a deploy. Explore the fake workspace
with the commands below, then decide what you would restart or roll back.

Commands: help · ls · cat deploy.log · cat status.txt · clear
`,
      shellCwd: "~/incident-42",
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(SHELL_FILES, [
      { id: "deploy.log", name: "deploy.log" },
      { id: "status.txt", name: "status.txt" },
      { id: "README", name: "README" },
    ]),
    contentCache: SHELL_FILES,
  },
]

export function buildSearchDocument(
  e: Pick<
    ExerciseSeed,
    | "title"
    | "description"
    | "prompt"
    | "aiContext"
    | "domain"
    | "difficulty"
    | "languages"
    | "tags"
    | "roleFamilies"
  >
): string {
  return searchDoc(e)
}

export function contentPrefixFor(slug: string, version: string): string {
  return `exercises/${slug}/${version}/`
}
