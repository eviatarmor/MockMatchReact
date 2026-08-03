import type { CellCoord } from "./types"

/** 0-based column → A, B, … Z, AA, … */
export function colToLetter(col: number): string {
  if (col < 0) return ""
  let n = col
  let s = ""
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

/** A1-style column letters → 0-based index, or -1 if invalid. */
export function letterToCol(letters: string): number {
  const u = letters.toUpperCase()
  if (!/^[A-Z]+$/.test(u)) return -1
  let n = 0
  for (let i = 0; i < u.length; i++) {
    n = n * 26 + (u.charCodeAt(i) - 64)
  }
  return n - 1
}

/** 0-based row/col → A1 (e.g. 0,0 → A1). */
export function toA1(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`
}

/** Parse A1 (or $A$1) into 0-based coords. */
export function parseA1(ref: string): CellCoord | null {
  const m = /^\$?([A-Za-z]+)\$?(\d+)$/.exec(ref.trim())
  if (!m) return null
  const col = letterToCol(m[1]!)
  const row = Number.parseInt(m[2]!, 10) - 1
  if (col < 0 || row < 0 || !Number.isFinite(row)) return null
  return { row, col }
}

export function cellKey(row: number, col: number): string {
  return `${row}:${col}`
}

export function parseCellKey(key: string): CellCoord | null {
  const i = key.indexOf(":")
  if (i < 0) return null
  const row = Number.parseInt(key.slice(0, i), 10)
  const col = Number.parseInt(key.slice(i + 1), 10)
  if (!Number.isFinite(row) || !Number.isFinite(col) || row < 0 || col < 0) {
    return null
  }
  return { row, col }
}

export function normalizeRange(
  a: CellCoord,
  b: CellCoord
): { start: CellCoord; end: CellCoord } {
  return {
    start: {
      row: Math.min(a.row, b.row),
      col: Math.min(a.col, b.col),
    },
    end: {
      row: Math.max(a.row, b.row),
      col: Math.max(a.col, b.col),
    },
  }
}

export function inRange(
  cell: CellCoord,
  start: CellCoord,
  end: CellCoord
): boolean {
  return (
    cell.row >= start.row &&
    cell.row <= end.row &&
    cell.col >= start.col &&
    cell.col <= end.col
  )
}
