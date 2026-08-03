import { describe, expect, it } from "vitest"
import {
  PDF_IMPORT_MAX_BASE64_CHARS,
  PDF_IMPORT_MAX_BYTES,
  documentImportPdfInputSchema,
} from "@/documents/import.js"

describe("PDF import limits", () => {
  it("exposes ~5 MiB byte cap and larger base64 char cap", () => {
    expect(PDF_IMPORT_MAX_BYTES).toBe(5 * 1024 * 1024)
    expect(PDF_IMPORT_MAX_BASE64_CHARS).toBeGreaterThan(PDF_IMPORT_MAX_BYTES)
  })
})

describe("documentImportPdfInputSchema", () => {
  it("accepts .pdf filename + base64", () => {
    const v = documentImportPdfInputSchema.parse({
      filename: " Resume.PDF ",
      pdfBase64: "JVBERi0xLjQ=",
    })
    expect(v.filename).toBe("Resume.PDF")
  })

  it("rejects non-pdf extension", () => {
    expect(() =>
      documentImportPdfInputSchema.parse({
        filename: "doc.docx",
        pdfBase64: "aaa",
      })
    ).toThrow()
  })

  it("rejects empty filename / empty base64", () => {
    expect(() =>
      documentImportPdfInputSchema.parse({
        filename: "  ",
        pdfBase64: "aaa",
      })
    ).toThrow()
    expect(() =>
      documentImportPdfInputSchema.parse({
        filename: "a.pdf",
        pdfBase64: "",
      })
    ).toThrow()
  })

  it("rejects invalid base64 charset", () => {
    expect(() =>
      documentImportPdfInputSchema.parse({
        filename: "a.pdf",
        pdfBase64: "!!!not-base64!!!",
      })
    ).toThrow()
  })

  it("allows whitespace inside base64 (stripped for check)", () => {
    const v = documentImportPdfInputSchema.parse({
      filename: "a.pdf",
      pdfBase64: "JVBERi0x\nLjQ=",
    })
    expect(v.pdfBase64).toContain("JVBERi0x")
  })
})
