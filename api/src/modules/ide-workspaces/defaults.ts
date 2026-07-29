import type { IdeWorkspaceDocumentJson } from "../../db/schema/ide-workspaces.js"

export const DEFAULT_WORKSPACE_TEMPLATE_ID = "workspace"

export function blankWorkspaceDocument(): IdeWorkspaceDocumentJson {
  return {
    tree: [
      {
        id: "src",
        name: "src",
        children: [{ id: "src/main.ts", name: "main.ts" }],
      },
    ],
    files: {
      "src/main.ts": {
        language: "typescript",
        content: "export const n = 1\n",
      },
    },
  }
}
