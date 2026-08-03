import { describe, expect, it } from "vitest"
import * as Y from "yjs"
import { jsonToY, mergeJsonIntoY, yToJson } from "@/yjs/json-y"

/** Y types must live on a Doc before read/toString. */
function attachRoot(value: unknown): Y.Map<unknown> {
  const doc = new Y.Doc()
  const root = doc.getMap("root")
  root.set("v", value)
  return root
}

describe("jsonToY / yToJson", () => {
  it("round-trips primitives", () => {
    expect(yToJson(jsonToY(null))).toBe(null)
    expect(yToJson(jsonToY(true))).toBe(true)
    expect(yToJson(jsonToY(42))).toBe(42)
  })

  it("round-trips strings via Y.Text", () => {
    const y = jsonToY("hello")
    expect(y).toBeInstanceOf(Y.Text)
    const root = attachRoot(y)
    expect(yToJson(root.get("v"))).toBe("hello")

    const emptyRoot = attachRoot(jsonToY(""))
    expect(yToJson(emptyRoot.get("v"))).toBe("")
  })

  it("round-trips arrays and objects", () => {
    const input = {
      name: "Ada",
      tags: ["math", "code"],
      meta: { n: 1, ok: true },
    }
    const y = jsonToY(input)
    expect(y).toBeInstanceOf(Y.Map)
    const root = attachRoot(y)
    expect(yToJson(root.get("v"))).toEqual(input)
  })
})

describe("mergeJsonIntoY", () => {
  it("updates Y.Text in place with shared prefix/suffix", () => {
    const doc = new Y.Doc()
    const map = doc.getMap("root")
    map.set("title", jsonToY("hello world"))

    mergeJsonIntoY(map, "title", "hello there world")
    const text = map.get("title")
    expect(text).toBeInstanceOf(Y.Text)
    expect((text as Y.Text).toString()).toBe("hello there world")
  })

  it("merges nested map keys and removes missing ones", () => {
    const doc = new Y.Doc()
    const root = doc.getMap("root")
    root.set("obj", jsonToY({ a: 1, b: 2, c: "x" }))

    mergeJsonIntoY(root, "obj", { a: 10, c: "y", d: 3 })
    expect(yToJson(root.get("obj"))).toEqual({ a: 10, c: "y", d: 3 })
  })

  it("rebuilds array when length changes; merges same-length", () => {
    const doc = new Y.Doc()
    const root = doc.getMap("root")
    root.set("list", jsonToY(["a", "b"]))

    mergeJsonIntoY(root, "list", ["a", "B"])
    expect(yToJson(root.get("list"))).toEqual(["a", "B"])

    mergeJsonIntoY(root, "list", ["only"])
    expect(yToJson(root.get("list"))).toEqual(["only"])
  })

  it("replaces when type diverges", () => {
    const doc = new Y.Doc()
    const root = doc.getMap("root")
    root.set("v", jsonToY("text"))
    mergeJsonIntoY(root, "v", 99)
    expect(root.get("v")).toBe(99)

    mergeJsonIntoY(root, "v", { nested: true })
    expect(yToJson(root.get("v"))).toEqual({ nested: true })
  })
})
