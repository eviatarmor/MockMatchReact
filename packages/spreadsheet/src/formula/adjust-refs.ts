/**
 * Adjust A1-style references in a formula by (dRow, dCol), honoring $ locks.
 * Literals / strings are left alone (double-quoted segments skipped).
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

function adjustOneRef(ref: string, dRow: number, dCol: number): string {
  const m = /^(\$)?([A-Za-z]{1,3})(\$)?(\d{1,7})$/.exec(ref)
  if (!m) return ref
  const colAbs = Boolean(m[1])
  const rowAbs = Boolean(m[3])
  let col = letterToCol(m[2]!)
  let row = Number.parseInt(m[4]!, 10) - 1
  if (!colAbs) col += dCol
  if (!rowAbs) row += dRow
  if (col < 0 || row < 0) return "#REF!"
  return `${colAbs ? "$" : ""}${colToLetter(col)}${rowAbs ? "$" : ""}${row + 1}`
}

/**
 * Walk formula text and shift unlocked refs. Non-formulas returned as-is.
 */
export function adjustFormulaRefs(
  raw: string,
  dRow: number,
  dCol: number
): string {
  if (!raw.startsWith("=") || (dRow === 0 && dCol === 0)) return raw

  // Split on double-quoted strings so we don't touch "A1" text
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
        return `${prefix}${adjustOneRef(ref, dRow, dCol)}`
      })
    )
    i = j
  }
  return parts.join("")
}

/**
 * Copy a cell's raw into a target offset from the source cell.
 * Formulas get relative/absolute ref adjustment; literals are copied.
 */
export function copyCellRawWithOffset(
  sourceRaw: string,
  dRow: number,
  dCol: number
): string {
  if (!sourceRaw.startsWith("=")) return sourceRaw
  return adjustFormulaRefs(sourceRaw, dRow, dCol)
}
