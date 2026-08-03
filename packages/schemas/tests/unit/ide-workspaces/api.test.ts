import { describe, expect, it } from "vitest"
import {
  ideWorkspaceCreateInputSchema,
  ideWorkspaceIdInputSchema,
  ideWorkspaceListInputSchema,
  ideWorkspaceUpdateInputSchema,
} from "@/ide-workspaces/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("ideWorkspaceListInputSchema", () => {
  it("applies pagination defaults", () => {
    const v = ideWorkspaceListInputSchema.parse({})
    expect(v.page).toBe(1)
    expect(v.pageSize).toBe(10)
  })
})

describe("ideWorkspaceIdInputSchema", () => {
  it("requires uuid", () => {
    expect(ideWorkspaceIdInputSchema.parse({ id: UUID }).id).toBe(UUID)
    expect(() => ideWorkspaceIdInputSchema.parse({ id: "x" })).toThrow()
  })
})

describe("ideWorkspaceCreateInputSchema", () => {
  it("accepts empty body (all optional)", () => {
    expect(ideWorkspaceCreateInputSchema.parse({})).toEqual({})
  })

  it("accepts title + template + document", () => {
    const v = ideWorkspaceCreateInputSchema.parse({
      title: " React practice ",
      templateId: "react",
      document: {
        tree: [{ id: "App.tsx", name: "App.tsx" }],
        files: { "App.tsx": { content: "export {}", language: "typescript" } },
      },
    })
    expect(v.title).toBe("React practice")
    expect(v.templateId).toBe("react")
    expect(v.document?.files["App.tsx"]?.language).toBe("typescript")
  })

  it("rejects empty title / overlong templateId", () => {
    expect(() => ideWorkspaceCreateInputSchema.parse({ title: "  " })).toThrow()
    expect(() =>
      ideWorkspaceCreateInputSchema.parse({ templateId: "x".repeat(65) })
    ).toThrow()
  })
})

describe("ideWorkspaceUpdateInputSchema", () => {
  it("requires id", () => {
    expect(() => ideWorkspaceUpdateInputSchema.parse({})).toThrow()
    const v = ideWorkspaceUpdateInputSchema.parse({
      id: UUID,
      status: "archived",
    })
    expect(v.status).toBe("archived")
  })

  it("rejects bad status", () => {
    expect(() =>
      ideWorkspaceUpdateInputSchema.parse({ id: UUID, status: "gone" })
    ).toThrow()
  })
})
