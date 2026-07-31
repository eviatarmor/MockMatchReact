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
// (bubble, insertion, quicksort, …).
// Client-side C++ via clang++ WASM (Runno). Use Run / Run tests.

#include <iostream>
#include <vector>

void sortInts(std::vector<int>& a) {
  // TODO: sort a ascending
  (void)a;
}

int main() {
  std::vector<int> nums = {5, 1, 4, 2, 8};
  sortInts(nums);
  for (size_t i = 0; i < nums.size(); i++) {
    if (i) std::cout << ' ';
    std::cout << nums[i];
  }
  std::cout << '\\n';
  return 0;
}
`,
}

const SUM_IO_TESTS = [
  { name: "1+2+3", stdin: "1\n2\n3\n", expectedStdout: "6" },
  { name: "negatives", stdin: "10\n-3\n-2\n", expectedStdout: "5" },
  { name: "single zero", stdin: "0\n", expectedStdout: "0" },
] as const

const JS_SUM_FILES: ExerciseContentCache = {
  "sum.js": `// Exercise: sum numbers from stdin (one integer per line; blank line ends).
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
}

const TS_SUM_FILES: ExerciseContentCache = {
  "sum.ts": `// Exercise: sum numbers (TypeScript).
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
}

const PY_HELLO_FILES: ExerciseContentCache = {
  "main.py": `# Exercise: sum integers from stdin (one per line).
# Client-side Python via Pyodide — print() goes to the IDE terminal.

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
}

const JS_FIZZBUZZ_FILES: ExerciseContentCache = {
  "fizzbuzz.js": `// Exercise: FizzBuzz
// Read n from stdin. Print 1..n, one per line.
// Multiples of 3 → Fizz, 5 → Buzz, both → FizzBuzz.

function fizzBuzz(n) {
  const lines = []
  for (let i = 1; i <= n; i++) {
    // TODO: implement
    lines.push(String(i))
  }
  return lines.join("\\n")
}

const n = Number((readStdin().trim() || "5").split("\\n")[0])
console.log(fizzBuzz(n))
`,
}

const JS_REVERSE_FILES: ExerciseContentCache = {
  "reverse.js": `// Exercise: reverse a string
// Read one line from stdin; print it reversed.

function reverse(s) {
  // TODO
  return s
}

const line = (readline() ?? "").replace(/\\r$/, "")
console.log(reverse(line))
`,
}

const PY_FACTORIAL_FILES: ExerciseContentCache = {
  "factorial.py": `# Exercise: factorial
# Read n from stdin; print n!

import sys

def factorial(n: int) -> int:
    # TODO
    return 1

raw = sys.stdin.read().strip() or "5"
n = int(raw.splitlines()[0])
print(factorial(n))
`,
}

const TS_PALINDROME_FILES: ExerciseContentCache = {
  "palindrome.ts": `// Exercise: is palindrome?
// Read one line; print "true" or "false".
// Ignore case and non-alphanumeric characters.

function isPalindrome(s: string): boolean {
  // TODO
  return false
}

const line = (readline() ?? "").replace(/\\r$/, "")
console.log(isPalindrome(line) ? "true" : "false")
`,
}

const PY_VOWELS_FILES: ExerciseContentCache = {
  "vowels.py": `# Exercise: count vowels
# Read one line; print count of a/e/i/o/u (case-insensitive).

import sys

def count_vowels(s: str) -> int:
    # TODO
    return 0

line = (sys.stdin.readline() or "").rstrip("\\n\\r")
print(count_vowels(line))
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
    case "mjs":
    case "cjs":
    case "jsx":
      return "javascript"
    case "py":
      return "python"
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp"
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
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["sort.cpp"],
      entryPath: "sort.cpp",
      runtimeLanguage: "cpp",
      tests: [
        {
          name: "sample array",
          stdin: "",
          expectedStdout: "1 2 4 5 8",
        },
      ],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(CPP_FILES, [
      { id: "sort.cpp", name: "sort.cpp" },
    ]),
    contentCache: CPP_FILES,
  },
  {
    slug: "js-sum",
    title: "JavaScript · Sum lines",
    description:
      "Single-file JS exercise: sum integers from stdin. Runs in the browser via client-side runner.",
    prompt:
      "Implement sumLines (or equivalent) so console.log prints the total of integers in the input. One number per line. When stdin is empty the sample 1/2/3 should print 6.",
    aiContext:
      "JS fundamentals + I/O style algorithms. Assess correctness on empty input, non-numeric lines, negatives. Client-side browser runner (no Node). Variants: product, max, mean, parse CSV.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "easy",
    languages: ["javascript"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "javascript", "stdin", "browser-runner"],
    durationMin: 15,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["sum.js"],
      entryPath: "sum.js",
      runtimeLanguage: "javascript",
      tests: [...SUM_IO_TESTS],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(JS_SUM_FILES, [
      { id: "sum.js", name: "sum.js" },
    ]),
    contentCache: JS_SUM_FILES,
  },
  {
    slug: "ts-sum",
    title: "TypeScript · Sum lines",
    description:
      "Single-file TypeScript: sum integers. Transpiled with esbuild-wasm, runs in the browser.",
    prompt:
      "Implement sumLines(text: string): number. When stdin is empty, the sample 1/2/3 should print 6.",
    aiContext:
      "TypeScript fundamentals. Types are stripped client-side (esbuild-wasm). Assess correctness. Variants: generics, readonly input, parse floats.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "easy",
    languages: ["typescript"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "typescript", "browser-runner"],
    durationMin: 15,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["sum.ts"],
      entryPath: "sum.ts",
      runtimeLanguage: "typescript",
      tests: [...SUM_IO_TESTS],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(TS_SUM_FILES, [
      { id: "sum.ts", name: "sum.ts" },
    ]),
    contentCache: TS_SUM_FILES,
  },
  {
    slug: "py-hello",
    title: "Python · Sum lines",
    description:
      "Single-file Python: sum integers from stdin. Runs via Pyodide (CPython WASM) in the browser.",
    prompt:
      "Implement sum_lines so print() outputs the total of integers in the input. When stdin is empty, sample 1/2/3 should print 6. First run downloads Pyodide.",
    aiContext:
      "Python fundamentals in browser (Pyodide). Assess correctness, ValueError handling. Variants: product, mean, list comprehension rewrite.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "easy",
    languages: ["python"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "python", "pyodide", "browser-runner"],
    durationMin: 15,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["main.py"],
      entryPath: "main.py",
      runtimeLanguage: "python",
      tests: [...SUM_IO_TESTS],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(PY_HELLO_FILES, [
      { id: "main.py", name: "main.py" },
    ]),
    contentCache: PY_HELLO_FILES,
  },
  {
    slug: "js-fizzbuzz",
    title: "JavaScript · FizzBuzz",
    description:
      "Classic FizzBuzz: print 1..n with Fizz/Buzz/FizzBuzz from stdin n.",
    prompt:
      "Read n from stdin. Print numbers 1..n one per line; multiples of 3 → Fizz, 5 → Buzz, both → FizzBuzz.",
    aiContext:
      "Classic interview warm-up. Assess loops, modulo, string building. Client-side JS runner with I/O tests.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "easy",
    languages: ["javascript"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "javascript", "fizzbuzz", "browser-runner"],
    durationMin: 20,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["fizzbuzz.js"],
      entryPath: "fizzbuzz.js",
      runtimeLanguage: "javascript",
      tests: [
        {
          name: "n=5",
          stdin: "5\n",
          expectedStdout: "1\n2\nFizz\n4\nBuzz",
        },
        {
          name: "n=15",
          stdin: "15\n",
          expectedStdout:
            "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
        },
      ],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(JS_FIZZBUZZ_FILES, [
      { id: "fizzbuzz.js", name: "fizzbuzz.js" },
    ]),
    contentCache: JS_FIZZBUZZ_FILES,
  },
  {
    slug: "js-reverse",
    title: "JavaScript · Reverse string",
    description: "Reverse one line of text from stdin.",
    prompt: "Read one line; print it reversed.",
    aiContext:
      "String fundamentals. Assess iteration or built-ins. Empty string edge case.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "easy",
    languages: ["javascript"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "javascript", "strings", "browser-runner"],
    durationMin: 10,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["reverse.js"],
      entryPath: "reverse.js",
      runtimeLanguage: "javascript",
      tests: [
        { name: "hello", stdin: "hello\n", expectedStdout: "olleh" },
        { name: "palindrome", stdin: "racecar\n", expectedStdout: "racecar" },
        { name: "empty", stdin: "\n", expectedStdout: "" },
      ],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(JS_REVERSE_FILES, [
      { id: "reverse.js", name: "reverse.js" },
    ]),
    contentCache: JS_REVERSE_FILES,
  },
  {
    slug: "py-factorial",
    title: "Python · Factorial",
    description: "Compute n! from a single integer on stdin.",
    prompt: "Read n; print n! (0! = 1).",
    aiContext:
      "Loops or recursion. Edge case 0. Client-side Pyodide with I/O tests.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "easy",
    languages: ["python"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "python", "math", "browser-runner"],
    durationMin: 12,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["factorial.py"],
      entryPath: "factorial.py",
      runtimeLanguage: "python",
      tests: [
        { name: "5!", stdin: "5\n", expectedStdout: "120" },
        { name: "0!", stdin: "0\n", expectedStdout: "1" },
        { name: "7!", stdin: "7\n", expectedStdout: "5040" },
      ],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(PY_FACTORIAL_FILES, [
      { id: "factorial.py", name: "factorial.py" },
    ]),
    contentCache: PY_FACTORIAL_FILES,
  },
  {
    slug: "ts-palindrome",
    title: "TypeScript · Palindrome",
    description:
      "Check if a line is a palindrome; ignore case and non-alphanumeric chars.",
    prompt:
      'Read one line; print "true" or "false". Ignore case and non-alphanumeric characters.',
    aiContext:
      "String cleaning + two-pointer or reverse. TypeScript strip via esbuild-wasm.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "medium",
    languages: ["typescript"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "typescript", "strings", "browser-runner"],
    durationMin: 15,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["palindrome.ts"],
      entryPath: "palindrome.ts",
      runtimeLanguage: "typescript",
      tests: [
        { name: "racecar", stdin: "racecar\n", expectedStdout: "true" },
        { name: "hello", stdin: "hello\n", expectedStdout: "false" },
        {
          name: "A man a plan",
          stdin: "A man a plan a canal Panama\n",
          expectedStdout: "true",
        },
      ],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(TS_PALINDROME_FILES, [
      { id: "palindrome.ts", name: "palindrome.ts" },
    ]),
    contentCache: TS_PALINDROME_FILES,
  },
  {
    slug: "py-vowels",
    title: "Python · Count vowels",
    description: "Count a/e/i/o/u in a line (case-insensitive).",
    prompt: "Read one line; print the vowel count.",
    aiContext: "Character iteration, case folding. Simple Pyodide exercise.",
    format: "code_run",
    layout: "editor",
    domain: "coding",
    difficulty: "easy",
    languages: ["python"],
    roleFamilies: ["engineering"],
    tags: ["algorithms", "python", "strings", "browser-runner"],
    durationMin: 10,
    uiFlags: {
      treeEnabled: false,
      defaultShowTree: false,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: false,
      defaultOpenPaths: ["vowels.py"],
      entryPath: "vowels.py",
      runtimeLanguage: "python",
      tests: [
        { name: "hello", stdin: "hello\n", expectedStdout: "2" },
        { name: "rhythm", stdin: "rhythm\n", expectedStdout: "0" },
        { name: "Education", stdin: "Education\n", expectedStdout: "5" },
      ],
    },
    contentVersion: "v1",
    contentManifest: filesToManifest(PY_VOWELS_FILES, [
      { id: "vowels.py", name: "vowels.py" },
    ]),
    contentCache: PY_VOWELS_FILES,
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
