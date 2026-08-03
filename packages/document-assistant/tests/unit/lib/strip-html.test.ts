import { describe, expect, it } from "vitest"
import { stripHtml } from "@/lib/strip-html"

describe("stripHtml", () => {
  it("strips tags and collapses whitespace", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world")
  })

  it("handles empty", () => {
    expect(stripHtml("")).toBe("")
    expect(stripHtml("   ")).toBe("")
  })
})
