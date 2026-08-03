import { describe, expect, it } from "vitest"
import { isBlankHtml, stripHtml } from "@/lib/html"

describe("stripHtml", () => {
  it("returns empty for nullish / blank", () => {
    expect(stripHtml(null)).toBe("")
    expect(stripHtml(undefined)).toBe("")
    expect(stripHtml("")).toBe("")
    expect(stripHtml("   ")).toBe("")
  })

  it("strips tags and decodes nbsp", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world")
    expect(stripHtml("a&nbsp;b")).toBe("a b")
  })
})

describe("isBlankHtml", () => {
  it("true when no visible text", () => {
    expect(isBlankHtml("<p></p>")).toBe(true)
    expect(isBlankHtml("&nbsp;")).toBe(true)
  })

  it("false when text remains", () => {
    expect(isBlankHtml("<p>x</p>")).toBe(false)
  })
})
