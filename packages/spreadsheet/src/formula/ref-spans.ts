import { parseA1, toA1, normalizeRange } from "../address"
import type { CellCoord } from "../types"
import {
  assignRefColors,
  tokenizeFormula,
  type FormulaToken,
} from "./tokenize"

export type FormulaRefSpan = {
  readonly refKey: string
  readonly color: string
  readonly text: string
  readonly start: CellCoord
  readonly end: CellCoord
}

export type FormulaRefInsertSite = {
  readonly start: number
  readonly end: number
}

export type FormulaRefPickSession = {
  readonly start: number
  readonly end: number
  readonly anchor: CellCoord
}

const CELL_REF =
  /^\$?[A-Za-z]{1,3}\$?\d{1,7}(?:\s*:\s*\$?[A-Za-z]{1,3}\$?\d{1,7})?$/

/** True when draft is a formula we can pick refs into. */
export function isFormulaPickDraft(draft: string): boolean {
  return draft.startsWith("=")
}

/**
 * Parse A1 / A1:B2 (optional $) into inclusive 0-based range.
 * Returns null for invalid or multi-area text.
 */
export function parseRefTokenRange(text: string): {
  start: CellCoord
  end: CellCoord
} | null {
  const cleaned = text.replace(/\s+/g, "")
  const parts = cleaned.split(":")
  if (parts.length === 1) {
    const c = parseA1(parts[0]!)
    if (!c) return null
    return { start: c, end: c }
  }
  if (parts.length === 2) {
    const a = parseA1(parts[0]!)
    const b = parseA1(parts[1]!)
    if (!a || !b) return null
    return normalizeRange(a, b)
  }
  return null
}

function previousNonSpaceToken(
  tokens: readonly FormulaToken[],
  index: number
): FormulaToken | null {
  for (let i = index - 1; i >= 0; i--) {
    const t = tokens[i]!
    if (t.kind === "space") continue
    return t
  }
  return null
}

/**
 * Same-sheet formula refs with Excel-like palette colors.
 * Skips refs preceded by `!` (cross-sheet) for v1.
 */
export function parseFormulaRefSpans(formula: string): FormulaRefSpan[] {
  if (!formula.startsWith("=")) return []
  const tokens = tokenizeFormula(formula)
  const colors = assignRefColors(tokens)
  const spans: FormulaRefSpan[] = []

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!
    if (t.kind !== "ref" || !t.refKey) continue
    const prev = previousNonSpaceToken(tokens, i)
    if (prev?.kind === "op" && prev.text === "!") continue

    const range = parseRefTokenRange(t.text)
    if (!range) continue
    const color = colors.get(t.refKey)
    if (!color) continue
    spans.push({
      refKey: t.refKey,
      color,
      text: t.text,
      start: range.start,
      end: range.end,
    })
  }
  return spans
}

/** Color for a grid cell from formula ref spans (last match wins if overlap). */
export function refColorForCell(
  spans: readonly FormulaRefSpan[],
  row: number,
  col: number
): string | null {
  let color: string | null = null
  for (const s of spans) {
    if (
      row >= s.start.row &&
      row <= s.end.row &&
      col >= s.start.col &&
      col <= s.end.col
    ) {
      color = s.color
    }
  }
  return color
}

function isRefChar(ch: string): boolean {
  return /[A-Za-z0-9$:]/.test(ch)
}

/**
 * If caret sits on / at edge of an A1 ref token, return that token's span.
 * Otherwise insert site is a zero-width point at caret.
 */
export function findRefInsertSite(
  draft: string,
  caret: number
): FormulaRefInsertSite {
  const c = Math.max(0, Math.min(draft.length, caret))
  if (!draft.startsWith("=")) return { start: c, end: c }

  // Expand to contiguous ref-ish characters around caret
  let start = c
  let end = c
  while (start > 1 && isRefChar(draft.charAt(start - 1))) start -= 1
  while (end < draft.length && isRefChar(draft.charAt(end))) end += 1

  if (start < end) {
    const slice = draft.slice(start, end)
    if (CELL_REF.test(slice.replace(/\s/g, ""))) {
      return { start, end }
    }
  }
  return { start: c, end: c }
}

export function rangeToA1(anchor: CellCoord, focus: CellCoord): string {
  const { start, end } = normalizeRange(anchor, focus)
  if (start.row === end.row && start.col === end.col) {
    return toA1(start.row, start.col)
  }
  return `${toA1(start.row, start.col)}:${toA1(end.row, end.col)}`
}

/**
 * Insert or replace a ref at caret / active pick session.
 * When `session` is set (drag or replace-same-pick), rewrites that slice only.
 */
export function applyFormulaRefPick(
  draft: string,
  caret: number,
  anchor: CellCoord,
  focus: CellCoord,
  session: FormulaRefPickSession | null
): {
  readonly next: string
  readonly caret: number
  readonly session: FormulaRefPickSession
} {
  const refText = rangeToA1(anchor, focus)
  if (session) {
    const next =
      draft.slice(0, session.start) + refText + draft.slice(session.end)
    const end = session.start + refText.length
    return {
      next,
      caret: end,
      session: {
        start: session.start,
        end,
        anchor: session.anchor,
      },
    }
  }

  const site = findRefInsertSite(draft, caret)
  const next = draft.slice(0, site.start) + refText + draft.slice(site.end)
  const end = site.start + refText.length
  return {
    next,
    caret: end,
    session: {
      start: site.start,
      end,
      anchor,
    },
  }
}
