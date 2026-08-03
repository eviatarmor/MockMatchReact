import { describe, expect, it } from "vitest"
import {
  documentVersionGetInputSchema,
  documentVersionRestoreInputSchema,
  documentVersionSourceSchema,
  documentVersionsListInputSchema,
} from "@/documents/versions.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("documentVersionSourceSchema", () => {
  it("accepts known sources", () => {
    for (const s of [
      "create",
      "import",
      "autosave",
      "collab_flush",
      "restore",
    ] as const) {
      expect(documentVersionSourceSchema.parse(s)).toBe(s)
    }
    expect(() => documentVersionSourceSchema.parse("manual")).toThrow()
  })
})

describe("documentVersionsListInputSchema", () => {
  it("defaults pageSize; cursor optional", () => {
    const v = documentVersionsListInputSchema.parse({
      kind: "resume",
      id: UUID,
    })
    expect(v.pageSize).toBe(15)
    expect(v.cursor).toBeUndefined()
  })

  it("accepts cursor + pageSize", () => {
    const v = documentVersionsListInputSchema.parse({
      kind: "cover_letter",
      id: UUID,
      cursor: 2,
      pageSize: 20,
    })
    expect(v.cursor).toBe(2)
    expect(v.pageSize).toBe(20)
  })

  it("rejects cursor > 50 / pageSize > 50", () => {
    expect(() =>
      documentVersionsListInputSchema.parse({
        kind: "workspace",
        id: UUID,
        cursor: 51,
      })
    ).toThrow()
    expect(() =>
      documentVersionsListInputSchema.parse({
        kind: "whiteboard",
        id: UUID,
        pageSize: 51,
      })
    ).toThrow()
  })

  it("rejects invalid kind", () => {
    expect(() =>
      documentVersionsListInputSchema.parse({ kind: "pdf", id: UUID })
    ).toThrow()
  })
})

describe("documentVersionGetInputSchema / restore", () => {
  it("requires versionId", () => {
    const v = documentVersionGetInputSchema.parse({
      kind: "resume",
      id: UUID,
      versionId: UUID,
    })
    expect(v.versionId).toBe(UUID)

    expect(() =>
      documentVersionGetInputSchema.parse({
        kind: "resume",
        id: UUID,
      })
    ).toThrow()
  })

  it("restore reuses get shape", () => {
    const v = documentVersionRestoreInputSchema.parse({
      kind: "workspace",
      id: UUID,
      versionId: UUID,
    })
    expect(v.kind).toBe("workspace")
  })
})
