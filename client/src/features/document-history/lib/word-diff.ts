export type DiffSegment = {
  readonly type: "equal" | "add" | "del"
  readonly text: string
}

const ADD_CLASS =
  "text-green-700 bg-green-500/15 dark:text-green-400 dark:bg-green-500/20 rounded-sm px-0.5"
const DEL_CLASS =
  "text-red-700 bg-red-500/15 line-through dark:text-red-400 dark:bg-red-500/20 rounded-sm px-0.5"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Split into words + whitespace so spacing is preserved in the HTML. */
function tokenize(text: string): string[] {
  if (!text) return []
  return text.split(/(\s+)/).filter((t) => t.length > 0)
}

/**
 * Word-level LCS diff. Small fields only (resume lines) — O(n*m) is fine.
 */
export function wordDiff(oldText: string, newText: string): DiffSegment[] {
  const a = tokenize(oldText)
  const b = tokenize(newText)
  if (a.length === 0 && b.length === 0) return []
  if (a.length === 0) return [{ type: "add", text: newText }]
  if (b.length === 0) return [{ type: "del", text: oldText }]

  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => 0)
  )
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i]![j] = dp[i - 1]![j - 1]! + 1
      else dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!)
    }
  }

  const segs: DiffSegment[] = []
  let i = n
  let j = m
  const reverse: DiffSegment[] = []
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      reverse.push({ type: "equal", text: a[i - 1]! })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      reverse.push({ type: "add", text: b[j - 1]! })
      j--
    } else {
      reverse.push({ type: "del", text: a[i - 1]! })
      i--
    }
  }
  reverse.reverse()

  // Merge adjacent same-type segments
  for (const seg of reverse) {
    const last = segs[segs.length - 1]
    if (last && last.type === seg.type) {
      segs[segs.length - 1] = { type: last.type, text: last.text + seg.text }
    } else {
      segs.push(seg)
    }
  }
  return segs
}

/** Strip tags for comparison; keep plain text for word diff. */
export function stripHtml(html: string): string {
  if (typeof document !== "undefined") {
    const el = document.createElement("div")
    el.innerHTML = html
    return el.textContent ?? ""
  }
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function segmentsToHtml(segments: DiffSegment[]): string {
  return segments
    .map((seg) => {
      const t = escapeHtml(seg.text)
      if (seg.type === "add") return `<span class="${ADD_CLASS}">${t}</span>`
      if (seg.type === "del") return `<span class="${DEL_CLASS}">${t}</span>`
      return t
    })
    .join("")
}

/**
 * Diff two plain strings → HTML with green/red spans.
 * When equal, returns escaped plain text (no markup).
 */
export function diffToHtml(oldText: string, newText: string): string {
  if (oldText === newText) return escapeHtml(newText)
  return segmentsToHtml(wordDiff(oldText, newText))
}

/**
 * Diff two HTML fields by plain-text content; output is HTML with spans
 * (structure of original HTML is flattened to text — fine for history preview).
 */
export function diffHtmlFields(oldHtml: string, newHtml: string): string {
  const oldPlain = stripHtml(oldHtml)
  const newPlain = stripHtml(newHtml)
  if (oldPlain === newPlain && !oldPlain) return newHtml || ""
  return diffToHtml(oldPlain, newPlain)
}
