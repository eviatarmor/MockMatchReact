import { describe, expect, it } from "vitest"
import { pdfFilename } from "@/lib/export-document-pdf"

describe("pdfFilename", () => {
  it("appends .pdf when missing", () => {
    expect(pdfFilename("My Resume", "resume")).toBe("My-Resume.pdf")
  })

  it("keeps existing .pdf suffix case-insensitively", () => {
    expect(pdfFilename("report.PDF", "fallback")).toBe("report.PDF")
    expect(pdfFilename("report.pdf", "fallback")).toBe("report.pdf")
  })

  it("strips path-illegal characters and collapses whitespace", () => {
    expect(pdfFilename('a/b\\c:d*e?f"g<h>i|j', "x")).toBe("abcdefghij.pdf")
    expect(pdfFilename("  hello   world  ", "x")).toBe("hello-world.pdf")
  })

  it("uses fallback when title is empty or only illegal chars", () => {
    expect(pdfFilename("", "untitled")).toBe("untitled.pdf")
    expect(pdfFilename("   ", "untitled")).toBe("untitled.pdf")
    expect(pdfFilename('<>:"/\\|?*', "untitled")).toBe("untitled.pdf")
  })

  it("truncates stem to 80 chars before suffix logic", () => {
    const long = "a".repeat(100)
    const result = pdfFilename(long, "x")
    expect(result).toBe(`${"a".repeat(80)}.pdf`)
    expect(result.length).toBe(84)
  })
})
