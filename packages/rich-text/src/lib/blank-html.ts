/**
 * True when HTML (Lexical output) has no visible text.
 * Empty tags, `<br>`, and `&nbsp;` count as blank.
 */
export function isBlankHtml(html: string | null | undefined): boolean {
  if (!html) return true

  if (typeof document !== "undefined") {
    const el = document.createElement("div")
    el.innerHTML = html
    return !el.textContent?.replace(/\u00a0/g, " ").trim()
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
  return !text.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").trim()
}
