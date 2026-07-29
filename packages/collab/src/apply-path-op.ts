/** Minimal path get/set for collab LWW ops (dot paths + numeric array indices). */

export function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj
  const parts = path.split(".")
  let cur: unknown = obj
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

/**
 * Immutable set-by-path. Correctly walks through arrays (does not wipe them
 * when the next segment is an index).
 */
export function setByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const parts = path.split(".")
  if (parts.length === 0) return obj

  const root = structuredClone(obj) as Record<string, unknown>

  // Walk creating intermediates; return parent of last key for assignment
  let cur: unknown = root
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!
    const nextKey = parts[i + 1]!
    const asArrayIndex = /^\d+$/.test(nextKey)

    if (cur == null || typeof cur !== "object") return root

    const container = cur as Record<string, unknown> | unknown[]
    const existing = Array.isArray(container)
      ? container[Number(key)]
      : (container as Record<string, unknown>)[key]

    let child: unknown
    if (existing != null && typeof existing === "object") {
      // Clone so we don't mutate structuredClone siblings incorrectly
      child = Array.isArray(existing)
        ? [...existing]
        : { ...(existing as Record<string, unknown>) }
    } else {
      child = asArrayIndex ? [] : {}
    }

    if (Array.isArray(container)) {
      container[Number(key)] = child
    } else {
      ;(container as Record<string, unknown>)[key] = child
    }
    cur = child
  }

  const last = parts[parts.length - 1]!
  if (Array.isArray(cur)) {
    cur[Number(last)] = value
  } else if (cur != null && typeof cur === "object") {
    ;(cur as Record<string, unknown>)[last] = value
  }

  return root
}
