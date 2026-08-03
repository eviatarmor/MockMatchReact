import { describe, expect, it } from "vitest"
import {
  diffHtmlFields,
  diffToHtml,
  stripHtml,
  wordDiff,
} from "@/features/document-history/lib/word-diff"

describe("wordDiff", () => {
  it("returns empty for empty inputs", () => {
    expect(wordDiff("", "")).toEqual([])
  })

  it("treats empty old as pure add", () => {
    expect(wordDiff("", "hello")).toEqual([{ type: "add", text: "hello" }])
  })

  it("treats empty new as pure del", () => {
    expect(wordDiff("bye", "")).toEqual([{ type: "del", text: "bye" }])
  })

  it("marks changed words and keeps equals", () => {
    const segs = wordDiff("I like cats", "I love cats")
    expect(segs).toEqual([
      { type: "equal", text: "I " },
      { type: "del", text: "like" },
      { type: "add", text: "love" },
      { type: "equal", text: " cats" },
    ])
  })

  it("merges adjacent same-type segments", () => {
    const segs = wordDiff("a b c", "x y c")
    const types = segs.map((s) => s.type)
    // no two identical types back-to-back after merge
    for (let i = 1; i < types.length; i++) {
      expect(types[i]).not.toBe(types[i - 1])
    }
  })
})

describe("stripHtml", () => {
  it("strips tags to plain text", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world")
  })
})

describe("diffToHtml / diffHtmlFields", () => {
  it("returns escaped text when equal", () => {
    expect(diffToHtml("a < b", "a < b")).toBe("a &lt; b")
  })

  it("wraps adds and deletes in spans", () => {
    const html = diffToHtml("foo", "bar")
    expect(html).toContain("text-red")
    expect(html).toContain("text-green")
    expect(html).toContain("foo")
    expect(html).toContain("bar")
  })

  it("diffs HTML fields via plain text", () => {
    const html = diffHtmlFields("<p>old</p>", "<p>new</p>")
    expect(html).toContain("old")
    expect(html).toContain("new")
  })
})
