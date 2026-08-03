import { describe, expect, it } from "vitest"
import {
  blankWorkspaceDocument,
  DEFAULT_WORKSPACE_TEMPLATE_ID,
} from "@/modules/ide-workspaces/defaults.js"

describe("ide workspace defaults", () => {
  it("uses workspace template id", () => {
    expect(DEFAULT_WORKSPACE_TEMPLATE_ID).toBe("workspace")
  })

  it("blankWorkspaceDocument ships tree + file bodies", () => {
    const doc = blankWorkspaceDocument()
    expect(doc.tree.length).toBeGreaterThan(0)
    expect(doc.tree[0]!.id).toBe("src")
    expect(doc.files["src/index.ts"]?.language).toBe("typescript")
    expect(doc.files["src/index.ts"]?.content).toContain("workspace ready")
    expect(doc.files["src/lib/utils.ts"]?.content).toContain("export function add")
    expect(doc.files["package.json"]?.language).toBe("json")
    expect(JSON.parse(doc.files["package.json"]!.content).name).toBe("workspace")
  })

  it("tree file ids match files map keys", () => {
    const doc = blankWorkspaceDocument()
    const leafIds: string[] = []
    const walk = (nodes: typeof doc.tree) => {
      for (const n of nodes) {
        if ("children" in n && n.children) walk(n.children)
        else leafIds.push(n.id)
      }
    }
    walk(doc.tree)
    for (const id of leafIds) {
      expect(doc.files[id]).toBeDefined()
    }
  })
})
