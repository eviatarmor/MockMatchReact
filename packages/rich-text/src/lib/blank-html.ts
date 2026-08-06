/**
 * True when HTML (Lexical output) has no visible text.
 * Empty tags, `<br>`, and `&nbsp;` count as blank.
 *
 * Linear scan (no nested-quantifier strip regex) — package-local copy so
 * `@mockmatch/rich-text` stays free of document-editor / whiteboard deps.
 */
export function isBlankHtml(html: string | null | undefined): boolean {
  if (html == null || html === "") return true

  // DOM path when available (browser / jsdom)
  if (typeof document !== "undefined") {
    const probe = document.createElement("div")
    probe.innerHTML = html
    const visible = (probe.textContent ?? "")
      .split("\u00a0")
      .join(" ")
      .trim()
    return visible.length === 0
  }

  // SSR / node: strip markup with a single forward pass
  return stripTagsToText(html).length === 0
}

function stripTagsToText(html: string): string {
  let out = ""
  let depth = 0
  for (const ch of html) {
    if (ch === "<") {
      depth += 1
      continue
    }
    if (ch === ">") {
      depth = Math.max(0, depth - 1)
      continue
    }
    if (depth === 0) out += ch
  }
  return out
    .replaceAll("&nbsp;", " ")
    .replaceAll("\u00a0", " ")
    .trim()
}
