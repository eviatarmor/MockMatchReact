import { z } from "zod"

/** Max decoded PDF size (~5 MiB). Base64 is ~4/3 of that. */
export const PDF_IMPORT_MAX_BYTES = 5 * 1024 * 1024
export const PDF_IMPORT_MAX_BASE64_CHARS = Math.ceil(PDF_IMPORT_MAX_BYTES * 4 / 3) + 64

/**
 * Shared input for resume / cover-letter PDF import mutations.
 * Client sends base64 without data-URL prefix.
 */
export const documentImportPdfInputSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine((name) => name.toLowerCase().endsWith(".pdf"), {
      message: "Filename must end with .pdf",
    }),
  pdfBase64: z
    .string()
    .min(1)
    .max(PDF_IMPORT_MAX_BASE64_CHARS)
    .refine((value) => {
      const cleaned = value.replace(/\s+/g, "")
      return /^[A-Za-z0-9+/]+=*$/.test(cleaned)
    }, { message: "pdfBase64 must be valid base64" }),
})

export type DocumentImportPdfInput = z.infer<typeof documentImportPdfInputSchema>
