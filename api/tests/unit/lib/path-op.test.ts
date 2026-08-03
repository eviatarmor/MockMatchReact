import { describe, expect, it } from "vitest"
import { getByPath, setByPath } from "@/lib/path-op.js"

describe("getByPath", () => {
  it("returns root for empty path", () => {
    const obj = { a: 1 }
    expect(getByPath(obj, "")).toBe(obj)
  })

  it("reads nested keys", () => {
    expect(getByPath({ a: { b: 2 } }, "a.b")).toBe(2)
  })

  it("returns undefined for missing", () => {
    expect(getByPath({ a: 1 }, "a.b")).toBeUndefined()
  })

  it("reads array indices as string keys", () => {
    expect(getByPath({ items: [{ id: "x" }] }, "items.0.id")).toBe("x")
  })
})

describe("setByPath", () => {
  it("sets shallow key immutably", () => {
    const src = { a: 1 }
    const next = setByPath(src, "a", 2)
    expect(next.a).toBe(2)
    expect(src.a).toBe(1)
  })

  it("creates nested objects", () => {
    const next = setByPath({}, "a.b.c", 3)
    expect(next).toEqual({ a: { b: { c: 3 } } })
  })

  it("preserves arrays when indexing", () => {
    const src = { items: [{ id: "a" }, { id: "b" }] }
    const next = setByPath(src, "items.1.id", "B")
    expect(next.items).toEqual([{ id: "a" }, { id: "B" }])
    expect(Array.isArray(next.items)).toBe(true)
    expect(src.items[1]?.id).toBe("b")
  })
})
