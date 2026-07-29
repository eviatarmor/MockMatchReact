/**
 * True when HTML (Lexical output) has no visible text.
 * Empty tags, `<br>`, and `&nbsp;` count as blank.
 * Avoids ReDoS-prone tag-stripping regexes.
 */
export function isBlankHtml(html: string | null | undefined): boolean {
  if (!html) return true

  // Prefer DOM textContent when available (client).
  if (typeof document !== "undefined") {
    const el = document.createElement("div")
    el.innerHTML = html
    return !el.textContent?.replace(/\u00a0/g, " ").trim()
  }

  // SSR / non-DOM fallback: linear tag strip (no nested quantifiers).
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
  return !text.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").trim()
}
