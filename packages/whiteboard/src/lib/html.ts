/** Strip tags for canvas export / plain search. Safe linear scan. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ""
  if (typeof document !== "undefined") {
    const el = document.createElement("div")
    el.innerHTML = html
    return (el.textContent ?? "").replace(/\u00a0/g, " ").trim()
  }
  let text = ""
  let inTag = false
  for (let i = 0; i < html.length; i++) {
    const ch = html[i]
    if (ch === "<") {
      inTag = true
      continue
    }
    if (ch === ">") {
      inTag = false
      continue
    }
    if (!inTag) text += ch
  }
  return text.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").trim()
}

export function isBlankHtml(html: string | null | undefined): boolean {
  return !stripHtml(html)
}
