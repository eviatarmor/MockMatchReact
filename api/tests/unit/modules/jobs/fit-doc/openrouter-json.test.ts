import { describe, expect, it } from "vitest"
import { ensureId, ensureIdsDeep, parseModelJson } from "@/modules/jobs/fit-doc/openrouter-json.js"

describe("parseModelJson", () => {
  it("parses plain JSON object", () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 })
  })

  it("strips markdown fences", () => {
    expect(parseModelJson('```json\n{"ok":true}\n```')).toEqual({ ok: true })
    expect(parseModelJson('```\n{"ok":false}\n```')).toEqual({ ok: false })
  })

  it("extracts object when prose surrounds JSON", () => {
    expect(parseModelJson('Here you go:\n{"x":"y"}\nThanks!')).toEqual({
      x: "y",
    })
  })

  it("repairs trailing commas and smart quotes", () => {
    // U+201C / U+201D curly doubles → regular quotes; trailing comma stripped
    const curly = `{\u201Ca\u201D: 1,}`
    expect(parseModelJson(curly)).toEqual({ a: 1 })
    expect(parseModelJson('{"nested": true,}')).toEqual({ nested: true })
  })

  it("throws on unrecoverable input", () => {
    expect(() => parseModelJson("not json at all")).toThrow()
  })
})

describe("ensureId", () => {
  it("keeps non-empty strings", () => {
    expect(ensureId("abc")).toBe("abc")
  })

  it("generates uuid for empty/non-string", () => {
    expect(ensureId("")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
    expect(ensureId(null)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })
})

describe("ensureIdsDeep", () => {
  it("fills missing ids on typed objects", () => {
    const out = ensureIdsDeep({
      type: "summary",
      text: "hi",
      nested: { type: "paragraph", text: "p" },
    }) as {
      id: string
      type: string
      nested: { id: string; type: string }
    }
    expect(out.id).toBeTruthy()
    expect(out.nested.id).toBeTruthy()
  })

  it("replaces empty ids and preserves good ones", () => {
    const out = ensureIdsDeep({
      id: "keep-me",
      type: "skills",
      items: [
        { id: "", text: "React" },
        // missing id + type → auto-id via type branch
        { type: "item", text: "Go" },
      ],
    }) as {
      id: string
      items: Array<{ id: string; text: string }>
    }
    expect(out.id).toBe("keep-me")
    expect(out.items[0]!.id).toBeTruthy()
    expect(out.items[0]!.id).not.toBe("")
    expect(out.items[1]!.id).toBeTruthy()
  })

  it("walks arrays and leaves primitives", () => {
    expect(ensureIdsDeep([1, "a", null])).toEqual([1, "a", null])
  })
})
