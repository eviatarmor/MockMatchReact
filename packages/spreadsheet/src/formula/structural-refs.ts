/**
 * Adjust formula refs for structural insert/delete of rows or columns.
 * Unlike fill-offset adjust, absolute `$` locks still move (Excel behavior).
 */

const REF_RE =
  /(^|[^A-Za-z0-9_])(\$?[A-Za-z]{1,3}\$?\d{1,7})(?![A-Za-z0-9_])/g

function colToLetter(col: number): string {
  if (col < 0) return "#REF!"
  let n = col
  let s = ""
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

function letterToCol(letters: string): number {
  const u = letters.toUpperCase()
  let n = 0
  for (let i = 0; i < u.length; i++) {
    n = n * 26 + (u.charCodeAt(i) - 64)
  }
  return n - 1
}

function parseRef(ref: string): {
  colAbs: boolean
  rowAbs: boolean
  col: number
  row: number
} | null {
  const m = /^(\$)?([A-Za-z]{1,3})(\$)?(\d{1,7})$/.exec(ref)
  if (!m) return null
  return {
    colAbs: Boolean(m[1]),
    rowAbs: Boolean(m[3]),
    col: letterToCol(m[2]!),
    row: Number.parseInt(m[4]!, 10) - 1,
  }
}

function formatRef(
  colAbs: boolean,
  rowAbs: boolean,
  col: number,
  row: number
): string {
  if (col < 0 || row < 0) return "#REF!"
  return `${colAbs ? "$" : ""}${colToLetter(col)}${rowAbs ? "$" : ""}${row + 1}`
}

function mapFormulaRefs(
  raw: string,
  mapRef: (ref: string) => string
): string {
  if (!raw.startsWith("=")) return raw
  const parts: string[] = []
  let i = 0
  while (i < raw.length) {
    if (raw.charAt(i) === '"') {
      let j = i + 1
      while (j < raw.length) {
        if (raw.charAt(j) === '"') {
          if (raw.charAt(j + 1) === '"') {
            j += 2
            continue
          }
          j += 1
          break
        }
        j += 1
      }
      parts.push(raw.slice(i, j))
      i = j
      continue
    }
    let j = i + 1
    while (j < raw.length && raw.charAt(j) !== '"') j++
    const segment = raw.slice(i, j)
    parts.push(
      segment.replace(REF_RE, (_full, prefix: string, ref: string) => {
        return `${prefix}${mapRef(ref)}`
      })
    )
    i = j
  }
  return parts.join("")
}

/** Insert `count` rows at `at` (0-based). Refs at/after `at` shift down. */
export function adjustFormulaRefsForRowInsert(
  raw: string,
  at: number,
  count: number
): string {
  if (count <= 0) return raw
  return mapFormulaRefs(raw, (ref) => {
    const p = parseRef(ref)
    if (!p) return ref
    if (p.row >= at) p.row += count
    return formatRef(p.colAbs, p.rowAbs, p.col, p.row)
  })
}

/** Delete `count` rows starting at `at`. Refs in range → #REF!. */
export function adjustFormulaRefsForRowDelete(
  raw: string,
  at: number,
  count: number
): string {
  if (count <= 0) return raw
  const end = at + count - 1
  return mapFormulaRefs(raw, (ref) => {
    const p = parseRef(ref)
    if (!p) return ref
    if (p.row >= at && p.row <= end) return "#REF!"
    if (p.row > end) p.row -= count
    return formatRef(p.colAbs, p.rowAbs, p.col, p.row)
  })
}

/** Insert `count` cols at `at`. */
export function adjustFormulaRefsForColInsert(
  raw: string,
  at: number,
  count: number
): string {
  if (count <= 0) return raw
  return mapFormulaRefs(raw, (ref) => {
    const p = parseRef(ref)
    if (!p) return ref
    if (p.col >= at) p.col += count
    return formatRef(p.colAbs, p.rowAbs, p.col, p.row)
  })
}

/** Delete `count` cols starting at `at`. */
export function adjustFormulaRefsForColDelete(
  raw: string,
  at: number,
  count: number
): string {
  if (count <= 0) return raw
  const end = at + count - 1
  return mapFormulaRefs(raw, (ref) => {
    const p = parseRef(ref)
    if (!p) return ref
    if (p.col >= at && p.col <= end) return "#REF!"
    if (p.col > end) p.col -= count
    return formatRef(p.colAbs, p.rowAbs, p.col, p.row)
  })
}
