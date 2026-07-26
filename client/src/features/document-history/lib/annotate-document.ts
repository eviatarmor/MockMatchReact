import { diffHtmlFields, diffToHtml, stripHtml } from "./word-diff"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

/** Plain string fields that should never be treated as HTML. */
function annotatePlain(oldVal: string, newVal: string): string {
  return diffToHtml(oldVal ?? "", newVal ?? "")
}

function annotateMaybeHtml(oldVal: string, newVal: string): string {
  const o = oldVal ?? ""
  const n = newVal ?? ""
  // Heuristic: Lexical HTML usually contains tags
  if (/<[a-z][\s\S]*>/i.test(o) || /<[a-z][\s\S]*>/i.test(n)) {
    return diffHtmlFields(o, n)
  }
  return annotatePlain(o, n)
}

/**
 * Deep-annotate `current` strings vs `previous` for version preview.
 * Arrays of objects with `id` are matched by id (stable across reorder).
 */
export function annotateDocumentDiff(
  current: unknown,
  previous: unknown | null
): unknown {
  if (previous == null) return current
  return annotateValue(current, previous)
}

function annotateValue(cur: unknown, prev: unknown): unknown {
  if (typeof cur === "string") {
    const p = typeof prev === "string" ? prev : ""
    return annotateMaybeHtml(p, cur)
  }

  if (Array.isArray(cur)) {
    if (!Array.isArray(prev)) {
      return cur.map((item) => annotateValue(item, undefined))
    }
    // Prefer id-matching when elements are objects with id
    if (
      cur.length > 0 &&
      isRecord(cur[0]) &&
      typeof cur[0].id === "string"
    ) {
      const prevById = new Map<string, unknown>()
      for (const item of prev) {
        if (isRecord(item) && typeof item.id === "string") {
          prevById.set(item.id, item)
        }
      }
      const seen = new Set<string>()
      const result: unknown[] = cur.map((item) => {
        if (isRecord(item) && typeof item.id === "string") {
          seen.add(item.id)
          return annotateValue(item, prevById.get(item.id))
        }
        return annotateValue(item, undefined)
      })
      // Append removed items with all text struck through
      for (const item of prev) {
        if (
          isRecord(item) &&
          typeof item.id === "string" &&
          !seen.has(item.id)
        ) {
          result.push(markAllDeleted(item))
        }
      }
      return result
    }
    // Index-aligned arrays
    return cur.map((item, i) => annotateValue(item, prev[i]))
  }

  if (isRecord(cur)) {
    const prevRec = isRecord(prev) ? prev : {}
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(cur)) {
      out[key] = annotateValue(cur[key], prevRec[key])
    }
    return out
  }

  return cur
}

/** Mark every string in a removed subtree as deleted (red strikethrough). */
function markAllDeleted(value: unknown): unknown {
  if (typeof value === "string") {
    const plain = stripHtml(value)
    if (!plain.trim()) return value
    return diffToHtml(plain, "")
  }
  if (Array.isArray(value)) {
    return value.map(markAllDeleted)
  }
  if (isRecord(value)) {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value)) {
      out[key] = markAllDeleted(value[key])
    }
    return out
  }
  return value
}
