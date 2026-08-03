import { describe, expect, it } from "vitest"
import {
  ideFileEntrySchema,
  ideTreeNodeSchema,
  ideWorkspaceDocumentSchema,
  ideWorkspaceStatusSchema,
} from "@/ide-workspaces/document.js"

describe("ideWorkspaceStatusSchema", () => {
  it("allows draft/active/archived", () => {
    expect(ideWorkspaceStatusSchema.parse("draft")).toBe("draft")
    expect(ideWorkspaceStatusSchema.parse("active")).toBe("active")
    expect(ideWorkspaceStatusSchema.parse("archived")).toBe("archived")
    expect(() => ideWorkspaceStatusSchema.parse("published")).toThrow()
  })
})

describe("ideFileEntrySchema", () => {
  it("requires content; language optional", () => {
    expect(ideFileEntrySchema.parse({ content: "print(1)" }).content).toBe(
      "print(1)"
    )
    expect(
      ideFileEntrySchema.parse({ content: "", language: "python" }).language
    ).toBe("python")
  })

  it("rejects oversized language", () => {
    expect(() =>
      ideFileEntrySchema.parse({ content: "x", language: "x".repeat(65) })
    ).toThrow()
  })
})

describe("ideTreeNodeSchema", () => {
  it("accepts file leaf", () => {
    const n = ideTreeNodeSchema.parse({ id: "src/main.py", name: "main.py" })
    expect(n.children).toBeUndefined()
  })

  it("accepts nested folder", () => {
    const n = ideTreeNodeSchema.parse({
      id: "src",
      name: "src",
      children: [
        { id: "src/a.ts", name: "a.ts" },
        {
          id: "src/lib",
          name: "lib",
          children: [{ id: "src/lib/b.ts", name: "b.ts" }],
        },
      ],
    })
    expect(n.children).toHaveLength(2)
    expect(n.children?.[1]?.children?.[0]?.name).toBe("b.ts")
  })

  it("rejects empty id/name", () => {
    expect(() => ideTreeNodeSchema.parse({ id: "", name: "x" })).toThrow()
    expect(() => ideTreeNodeSchema.parse({ id: "x", name: "" })).toThrow()
  })
})

describe("ideWorkspaceDocumentSchema", () => {
  it("accepts empty workspace", () => {
    const doc = ideWorkspaceDocumentSchema.parse({ tree: [], files: {} })
    expect(doc.tree).toEqual([])
    expect(doc.files).toEqual({})
  })

  it("accepts tree + files map", () => {
    const doc = ideWorkspaceDocumentSchema.parse({
      tree: [{ id: "main.py", name: "main.py" }],
      files: {
        "main.py": { content: "print('hi')", language: "python" },
      },
    })
    expect(doc.files["main.py"]?.content).toContain("print")
  })

  it("rejects empty file path keys", () => {
    expect(() =>
      ideWorkspaceDocumentSchema.parse({
        tree: [],
        files: { "": { content: "x" } },
      })
    ).toThrow()
  })
})
