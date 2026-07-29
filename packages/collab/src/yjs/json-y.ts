import * as Y from "yjs"

/** Convert plain JSON into Yjs shared types (objects→Map, arrays→Array, strings→Text). */
export function jsonToY(value: unknown): unknown {
  if (value === null || value === undefined) return value ?? null
  if (typeof value === "boolean" || typeof value === "number") return value
  if (typeof value === "string") {
    const t = new Y.Text()
    if (value.length > 0) t.insert(0, value)
    return t
  }
  if (Array.isArray(value)) {
    const arr = new Y.Array()
    if (value.length > 0) {
      arr.insert(
        0,
        value.map((item) => jsonToY(item))
      )
    }
    return arr
  }
  if (typeof value === "object") {
    const map = new Y.Map()
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      map.set(k, jsonToY(v))
    }
    return map
  }
  return String(value)
}

/** Materialize Yjs shared types back to plain JSON. */
export function yToJson(value: unknown): unknown {
  if (value instanceof Y.Text) return value.toString()
  if (value instanceof Y.Array) {
    return value.toArray().map((item) => yToJson(item))
  }
  if (value instanceof Y.Map) {
    const out: Record<string, unknown> = {}
    value.forEach((v, k) => {
      out[k] = yToJson(v)
    })
    return out
  }
  return value
}

/**
 * Sync plain JSON into an existing Y container in place when possible
 * (preserves CRDT identity for matching structure). Falls back to replace.
 */
export function mergeJsonIntoY(
  parent: Y.Map<unknown> | Y.Array<unknown>,
  keyOrIndex: string | number,
  next: unknown
): void {
  const current =
    parent instanceof Y.Map
      ? parent.get(String(keyOrIndex))
      : parent.get(Number(keyOrIndex))

  if (typeof next === "string") {
    if (current instanceof Y.Text) {
      const cur = current.toString()
      if (cur === next) return
      // Prefer insert/delete delta when possible (same prefix/suffix)
      applyTextDiff(current, next)
      return
    }
    setOnParent(parent, keyOrIndex, jsonToY(next))
    return
  }

  if (next === null || typeof next === "boolean" || typeof next === "number") {
    if (current === next) return
    setOnParent(parent, keyOrIndex, next)
    return
  }

  if (Array.isArray(next)) {
    if (!(current instanceof Y.Array)) {
      setOnParent(parent, keyOrIndex, jsonToY(next))
      return
    }
    // Rebuild array when length/types diverge heavily — keep simple + correct
    const curArr = current.toArray()
    if (curArr.length !== next.length) {
      current.delete(0, current.length)
      if (next.length > 0) {
        current.insert(
          0,
          next.map((item) => jsonToY(item))
        )
      }
      return
    }
    for (let i = 0; i < next.length; i++) {
      mergeJsonIntoY(current, i, next[i])
    }
    return
  }

  if (typeof next === "object") {
    if (!(current instanceof Y.Map)) {
      setOnParent(parent, keyOrIndex, jsonToY(next))
      return
    }
    const nextObj = next as Record<string, unknown>
    const nextKeys = new Set(Object.keys(nextObj))
    // Remove keys gone from next
    const toDelete: string[] = []
    current.forEach((_, k) => {
      if (!nextKeys.has(k)) toDelete.push(k)
    })
    for (const k of toDelete) current.delete(k)
    for (const [k, v] of Object.entries(nextObj)) {
      mergeJsonIntoY(current, k, v)
    }
  }
}

function setOnParent(
  parent: Y.Map<unknown> | Y.Array<unknown>,
  keyOrIndex: string | number,
  value: unknown
): void {
  if (parent instanceof Y.Map) {
    parent.set(String(keyOrIndex), value)
  } else {
    const i = Number(keyOrIndex)
    if (i < parent.length) {
      parent.delete(i, 1)
      parent.insert(i, [value])
    } else {
      parent.insert(parent.length, [value])
    }
  }
}

/** Minimal prefix/suffix text replace for better concurrent Y.Text merges. */
function applyTextDiff(ytext: Y.Text, next: string): void {
  const cur = ytext.toString()
  if (cur === next) return

  let start = 0
  const minLen = Math.min(cur.length, next.length)
  while (start < minLen && cur[start] === next[start]) start++

  let endCur = cur.length
  let endNext = next.length
  while (
    endCur > start &&
    endNext > start &&
    cur[endCur - 1] === next[endNext - 1]
  ) {
    endCur--
    endNext--
  }

  const deleteLen = endCur - start
  if (deleteLen > 0) ytext.delete(start, deleteLen)
  const insert = next.slice(start, endNext)
  if (insert.length > 0) ytext.insert(start, insert)
}
