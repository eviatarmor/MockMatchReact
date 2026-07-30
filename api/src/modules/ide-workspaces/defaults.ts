import type { IdeWorkspaceDocumentJson } from "../../db/schema/ide-workspaces.js"

export const DEFAULT_WORKSPACE_TEMPLATE_ID = "workspace"

export function blankWorkspaceDocument(): IdeWorkspaceDocumentJson {
  return {
    tree: [
      {
        id: "src",
        name: "src",
        children: [
          { id: "src/index.ts", name: "index.ts" },
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
    ],
    files: {
      "src/index.ts": {
        language: "typescript",
        content:
          'console.log("workspace ready — Run uses collab WS + sandbox")\n',
      },
      "src/lib/utils.ts": {
        language: "typescript",
        content:
          "export function add(a: number, b: number): number {\n  return a + b\n}\n",
      },
      "src/lib/utils.test.ts": {
        language: "typescript",
        content: `import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { add } from "./utils.ts"

describe("utils", () => {
  it("adds", () => {
    assert.equal(add(2, 3), 5)
  })
})
`,
      },
      "package.json": {
        language: "json",
        content: `{
  "name": "workspace",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node --experimental-strip-types src/index.ts",
    "test": "node --experimental-strip-types --test src/lib/utils.test.ts"
  }
}
`,
      },
    },
  }
}
