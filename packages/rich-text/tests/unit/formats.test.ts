import { describe, expect, it } from "vitest"
import { normalizeLinkUrl } from "../../src/lib/formats"

describe("normalizeLinkUrl", () => {
  it("returns null for empty", () => {
    expect(normalizeLinkUrl("")).toBe(null)
    expect(normalizeLinkUrl("   ")).toBe(null)
  })

  it("keeps absolute http(s)", () => {
    expect(normalizeLinkUrl("https://example.com")).toBe("https://example.com")
    expect(normalizeLinkUrl("http://example.com/a")).toBe(
      "http://example.com/a"
    )
  })

  it("keeps mailto and relative paths", () => {
    expect(normalizeLinkUrl("mailto:a@b.c")).toBe("mailto:a@b.c")
    expect(normalizeLinkUrl("/docs")).toBe("/docs")
    expect(normalizeLinkUrl("#section")).toBe("#section")
  })

  it("prefixes https when scheme missing", () => {
    expect(normalizeLinkUrl("example.com")).toBe("https://example.com")
    expect(normalizeLinkUrl("  www.x.io/path ")).toBe("https://www.x.io/path")
  })
})
