import type { IdeTab, IdeTreeNode } from "@mockmatch/ide"
import type { IdeFormatPreset, IdeFormatSlug } from "./types"
import { sortTreeDeep } from "./lib/tree-ops"

export const IDE_FORMAT_PRESETS: Record<IdeFormatSlug, IdeFormatPreset> = {
  "code-run": {
    slug: "code-run",
    trackFormat: "codeRun",
    defaultShowTree: false,
    titleKey: "formats.codeRun.title",
    descriptionKey: "formats.codeRun.description",
  },
  workspace: {
    slug: "workspace",
    trackFormat: "workspace",
    defaultShowTree: true,
    titleKey: "formats.workspace.title",
    descriptionKey: "formats.workspace.description",
  },
}

/** Minimal tree for code-run when user toggles tree on. */
export const CODE_RUN_TREE: IdeTreeNode[] = sortTreeDeep([
  {
    id: "solution",
    name: "solution",
    children: [
      { id: "solution/solution.ts", name: "solution.ts" },
      { id: "solution/tests.ts", name: "tests.ts" },
    ],
  },
])

export const CODE_RUN_TABS: IdeTab[] = [
  {
    id: "solution/solution.ts",
    title: "solution.ts",
    language: "typescript",
    value: `/**
 * Code run preview — submit/execute is not wired yet.
 * Write your solution below.
 */
export function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]!
    const j = seen.get(need)
    if (j !== undefined) return [j, i]
    seen.set(nums[i]!, i)
  }
  return []
}
`,
  },
  {
    id: "solution/tests.ts",
    title: "tests.ts",
    language: "typescript",
    value: `import { twoSum } from "./solution"

// Local checks only — judge runner TBD.
console.assert(
  JSON.stringify(twoSum([2, 7, 11, 15], 9)) === JSON.stringify([0, 1])
)
`,
  },
]

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

/** Seed data — folders sorted above files at every level (once). */
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

Multiplayer IDE with live collab (Yjs, presence, share links). **Run** / **Run tests** are placeholders until a judge is wired.
`,
  },
]

export const WORKSPACE_DEFAULT_EXPANDED = ["src", "src/lib"]
export const CODE_RUN_DEFAULT_EXPANDED = ["solution"]

export function tabsForFormat(slug: IdeFormatSlug): IdeTab[] {
  return slug === "code-run" ? CODE_RUN_TABS : WORKSPACE_TABS
}

export function treeForFormat(slug: IdeFormatSlug): IdeTreeNode[] {
  return slug === "code-run" ? CODE_RUN_TREE : WORKSPACE_TREE
}

export function defaultExpandedForFormat(slug: IdeFormatSlug): string[] {
  return slug === "code-run"
    ? CODE_RUN_DEFAULT_EXPANDED
    : WORKSPACE_DEFAULT_EXPANDED
}
