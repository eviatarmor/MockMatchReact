import { extractText, getDocumentProxy } from "unpdf"

/**
 * Extract plain text from a PDF buffer (local, no LLM).
 * Used so we can run import against any cheap text model on OpenRouter.
 */
export async function extractPdfText(pdfBytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(pdfBytes)
  const { text } = await extractText(pdf, { mergePages: true })
  const cleaned = (typeof text === "string" ? text : String(text ?? ""))
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  if (!cleaned || cleaned.length < 20) {
    throw new Error(
      "Could not extract enough text from this PDF. Scanned/image-only PDFs are not supported yet."
    )
  }

  // Cap prompt size for cheap models (~120k chars ≈ lots of tokens; keep modest).
  const MAX_CHARS = 60_000
  if (cleaned.length > MAX_CHARS) {
    return `${cleaned.slice(0, MAX_CHARS)}\n\n[…truncated…]`
  }
  return cleaned
}
