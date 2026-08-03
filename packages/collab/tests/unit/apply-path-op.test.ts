import { describe, expect, it } from "vitest"
import { getByPath, setByPath } from "@/apply-path-op"

describe("getByPath", () => {
  it("returns root for empty path", () => {
    const obj = { a: 1 }
    expect(getByPath(obj, "")).toBe(obj)
  })

  it("walks nested objects", () => {
    expect(getByPath({ a: { b: { c: 3 } } }, "a.b.c")).toBe(3)
  })

  it("returns undefined for missing / non-object mid path", () => {
    expect(getByPath({ a: 1 }, "a.b")).toBeUndefined()
    expect(getByPath({ a: null }, "a.b")).toBeUndefined()
    expect(getByPath({}, "missing")).toBeUndefined()
  })

  it("reads array indices as string keys", () => {
    expect(getByPath({ items: ["x", "y"] }, "items.1")).toBe("y")
  })
})

describe("setByPath", () => {
  it("sets nested without mutating original", () => {
    const orig = { a: { b: 1 } }
    const next = setByPath(orig, "a.b", 2)
    expect(getByPath(next, "a.b")).toBe(2)
    expect(orig.a.b).toBe(1)
  })

  it("handles array indices without wiping array", () => {
    const next = setByPath({ items: ["x", "y"] }, "items.0", "X")
    expect(getByPath(next, "items.0")).toBe("X")
    expect(Array.isArray(next.items)).toBe(true)
    expect((next.items as string[])[1]).toBe("y")
  })

  it("creates intermediate objects", () => {
    const next = setByPath({}, "a.b.c", 9)
    expect(getByPath(next, "a.b.c")).toBe(9)
  })

  it("creates intermediate arrays when next segment is numeric", () => {
    const next = setByPath({}, "rows.0.name", "Ada")
    expect(Array.isArray(next.rows)).toBe(true)
    expect(getByPath(next, "rows.0.name")).toBe("Ada")
  })

  it("sets deep value inside array of objects", () => {
    const next = setByPath(
      { sections: [{ id: "s1", text: "old" }] },
      "sections.0.text",
      "new"
    )
    expect(getByPath(next, "sections.0.text")).toBe("new")
    expect(getByPath(next, "sections.0.id")).toBe("s1")
  })

  it("can replace entire branch", () => {
    const next = setByPath({ a: { b: 1 } }, "a", { c: 2 })
    expect(getByPath(next, "a.c")).toBe(2)
    expect(getByPath(next, "a.b")).toBeUndefined()
  })
})
