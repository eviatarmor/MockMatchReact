/** Strip tags for mention labels / AI context (browser DOMParser). */
export function stripHtml(html: string): string {
  if (!html?.trim()) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim()
}
