import { describe, expect, it } from "vitest"
import { parseDocumentStyle } from "@/lib/parse-document-style"

const DEFAULT = {
  accent: "blue",
  typeface: "geist",
  heading: "accent",
  density: "normal",
} as const

describe("parseDocumentStyle", () => {
  it("returns fallback for nullish or non-object input", () => {
    expect(parseDocumentStyle(null)).toEqual(DEFAULT)
    expect(parseDocumentStyle(undefined)).toEqual(DEFAULT)
    expect(parseDocumentStyle("blue")).toEqual(DEFAULT)
    expect(parseDocumentStyle(42)).toEqual(DEFAULT)
  })

  it("merges partial objects with defaults", () => {
    expect(parseDocumentStyle({ accent: "green" })).toEqual({
      ...DEFAULT,
      accent: "green",
    })
    expect(
      parseDocumentStyle({
        typeface: "inter",
        density: "compact",
      })
    ).toEqual({
      ...DEFAULT,
      typeface: "inter",
      density: "compact",
    })
  })

  it("ignores non-string field values", () => {
    expect(
      parseDocumentStyle({
        accent: 1,
        typeface: null,
        heading: { x: 1 },
        density: true,
      })
    ).toEqual(DEFAULT)
  })

  it("accepts custom fallback", () => {
    const custom = {
      accent: "violet" as const,
      typeface: "serif" as const,
      heading: "ink" as const,
      density: "spacious" as const,
    }
    expect(parseDocumentStyle(null, custom)).toEqual(custom)
    expect(parseDocumentStyle({ accent: "red" }, custom)).toEqual({
      ...custom,
      accent: "red",
    })
  })
})
