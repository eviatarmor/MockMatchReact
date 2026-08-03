import { describe, expect, it } from "vitest"
import { PAGE_EDITOR_NODES } from "../../src/nodes"

describe("PAGE_EDITOR_NODES", () => {
  it("registers core freeform nodes", () => {
    expect(PAGE_EDITOR_NODES.length).toBeGreaterThanOrEqual(6)
    const names = PAGE_EDITOR_NODES.map((n) => n.getType?.() ?? n.name ?? "")
    // Lexical nodes expose getType as static on class
    const types = PAGE_EDITOR_NODES.map((Node) => {
      try {
        return (Node as { getType: () => string }).getType()
      } catch {
        return String(Node)
      }
    })
    expect(types).toEqual(
      expect.arrayContaining([
        "heading",
        "quote",
        "list",
        "listitem",
        "link",
        "code",
        "horizontalrule",
      ])
    )
    void names
  })
})
