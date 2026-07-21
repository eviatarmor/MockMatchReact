function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000"
}

export type DocumentExportKind = "resume" | "cover-letter"

/** Sanitize a user title into a safe download filename stem. */
export function pdfFilename(title: string, fallback: string): string {
  const stem = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80)
  const base = stem || fallback
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`
}

/**
 * Download a server-rendered PDF of the print page for a resume or cover letter.
 * Uses cookie auth (`credentials: "include"`).
 */
export async function downloadDocumentPdf(input: {
  readonly kind: DocumentExportKind
  readonly id: string
  readonly filename: string
}): Promise<void> {
  const segment = input.kind === "resume" ? "resumes" : "cover-letters"
  const url = `${getApiBaseUrl()}/export/${segment}/${input.id}/pdf`

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    let message = `Export failed (${response.status})`
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // non-JSON error body
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = input.filename
    anchor.rel = "noopener"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
