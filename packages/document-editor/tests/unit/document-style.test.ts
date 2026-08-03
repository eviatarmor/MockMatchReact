import { describe, expect, it } from "vitest"
import {
  isSerifTypeface,
  resolveStyleClasses,
  type DocumentStyle,
} from "@/document-style"

const base: DocumentStyle = {
  accent: "blue",
  typeface: "geist",
  heading: "accent",
  density: "normal",
}

describe("isSerifTypeface", () => {
  it("marks source-serif and newsreader as serif", () => {
    expect(isSerifTypeface("source-serif")).toBe(true)
    expect(isSerifTypeface("newsreader")).toBe(true)
  })

  it("marks geist and mono as non-serif", () => {
    expect(isSerifTypeface("geist")).toBe(false)
    expect(isSerifTypeface("mono")).toBe(false)
  })
})

describe("resolveStyleClasses", () => {
  it("resolves accent + typeface + density", () => {
    const r = resolveStyleClasses(base)
    expect(r.accentText).toContain("text-blue-")
    expect(r.accentBg).toBe("bg-blue-600")
    expect(r.accentBorder).toBe("border-blue-600")
    expect(r.fontClass).toBe("font-sans")
    expect(r.serif).toBe(false)
    expect(r.sectionGap).toBe("gap-5")
    expect(r.bodyLeading).toBe("leading-relaxed")
  })

  it("builds accent heading with accent text class", () => {
    const r = resolveStyleClasses({ ...base, heading: "accent" })
    expect(r.headingClass).toContain("uppercase")
    expect(r.headingClass).toContain("text-blue-")
  })

  it("builds underline heading with accent border", () => {
    const r = resolveStyleClasses({ ...base, heading: "underline", accent: "teal" })
    expect(r.headingClass).toContain("border-b-2")
    expect(r.headingClass).toContain("border-teal-")
  })

  it("builds small-caps and plain headings without accent tint", () => {
    const small = resolveStyleClasses({ ...base, heading: "small-caps" })
    expect(small.headingClass).toContain("tracking-[0.2em]")
    expect(small.headingClass).not.toMatch(/text-blue-/)

    const plain = resolveStyleClasses({ ...base, heading: "plain" })
    expect(plain.headingClass).toContain("text-neutral-900")
    expect(plain.headingClass).not.toMatch(/uppercase/)
  })

  it("maps density and serif typefaces", () => {
    const compact = resolveStyleClasses({
      ...base,
      density: "compact",
      typeface: "source-serif",
    })
    expect(compact.sectionGap).toBe("gap-3")
    expect(compact.bodyLeading).toBe("leading-snug")
    expect(compact.fontClass).toBe("font-serif")
    expect(compact.serif).toBe(true)

    const relaxed = resolveStyleClasses({ ...base, density: "relaxed", typeface: "mono" })
    expect(relaxed.sectionGap).toBe("gap-7")
    expect(relaxed.bodyLeading).toBe("leading-loose")
    expect(relaxed.fontClass).toBe("font-mono")
  })
})
