import { describe, expect, it } from "vitest"
import { isBlankHtml } from "@/lib/blank-html"

describe("isBlankHtml", () => {
  it("treats nullish / empty as blank", () => {
    expect(isBlankHtml(null)).toBe(true)
    expect(isBlankHtml(undefined)).toBe(true)
    expect(isBlankHtml("")).toBe(true)
    expect(isBlankHtml("   ")).toBe(true)
  })

  it("treats empty tags and br as blank", () => {
    expect(isBlankHtml("<p></p>")).toBe(true)
    expect(isBlankHtml("<p><br></p>")).toBe(true)
    expect(isBlankHtml("<div><br/></div>")).toBe(true)
  })

  it("treats nbsp-only as blank", () => {
    expect(isBlankHtml("&nbsp;")).toBe(true)
    expect(isBlankHtml("<p>&nbsp;</p>")).toBe(true)
    expect(isBlankHtml("<p>\u00a0</p>")).toBe(true)
  })

  it("detects visible text", () => {
    expect(isBlankHtml("<p>Hello</p>")).toBe(false)
    expect(isBlankHtml("plain")).toBe(false)
    expect(isBlankHtml("<p>&nbsp;x</p>")).toBe(false)
  })
})
