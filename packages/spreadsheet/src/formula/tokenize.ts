import { getFormulaFunctionNameSet } from "./functions"

export type FormulaTokenKind =
  | "text"
  | "equals"
  | "function"
  | "ref"
  | "number"
  | "string"
  | "op"
  | "space"

export type FormulaToken = {
  readonly kind: FormulaTokenKind
  readonly text: string
  /** Stable key for ref/range color cycling (uppercase normalized ref). */
  readonly refKey?: string
}

/** Excel-like palette for distinct ranges / cell refs in one formula. */
export const FORMULA_REF_COLORS = [
  "#1a73e8", // blue
  "#188038", // green
  "#e37400", // orange
  "#a142f4", // purple
  "#d93025", // red
  "#00838f", // teal
  "#c5221f", // dark red
  "#1967d2", // light blue
] as const

export const FORMULA_FUNCTION_COLOR = "#1a56db" // strong blue for function names
export const FORMULA_STRING_COLOR = "#188038"
export const FORMULA_NUMBER_COLOR = "#b06000"

const CELL = /^(?:\$?[A-Za-z]{1,3}\$?\d{1,7})/
const RANGE =
  /^(?:\$?[A-Za-z]{1,3}\$?\d{1,7})\s*:\s*(?:\$?[A-Za-z]{1,3}\$?\d{1,7})/
const IDENT = /^[A-Za-z_][A-Za-z0-9_.]*/
const NUMBER = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/
const OPS = /^[+\-*/^&=<>%,;:()!]/

function normalizeRefKey(text: string): string {
  return text.replace(/\s+/g, "").toUpperCase()
}

/**
 * Lex a formula (or plain cell text) into highlight tokens.
 * Non-formulas (no leading `=`) are a single `text` token.
 */
export function tokenizeFormula(raw: string): FormulaToken[] {
  if (!raw) return []
  if (!raw.startsWith("=")) {
    return [{ kind: "text", text: raw }]
  }

  const fnSet = getFormulaFunctionNameSet()
  const tokens: FormulaToken[] = []
  let i = 0

  // Leading =
  tokens.push({ kind: "equals", text: "=" })
  i = 1

  while (i < raw.length) {
    const ch = raw.charAt(i)

    if (/\s/.test(ch)) {
      let j = i + 1
      while (j < raw.length && /\s/.test(raw.charAt(j))) j++
      tokens.push({ kind: "space", text: raw.slice(i, j) })
      i = j
      continue
    }

    if (ch === '"') {
      let j = i + 1
      while (j < raw.length) {
        if (raw.charAt(j) === '"') {
          // escaped ""
          if (raw.charAt(j + 1) === '"') {
            j += 2
            continue
          }
          j += 1
          break
        }
        j += 1
      }
      tokens.push({ kind: "string", text: raw.slice(i, j) })
      i = j
      continue
    }

    const rest = raw.slice(i)

    const range = rest.match(RANGE)
    if (range) {
      const text = range[0]
      tokens.push({
        kind: "ref",
        text,
        refKey: normalizeRefKey(text),
      })
      i += text.length
      continue
    }

    const cell = rest.match(CELL)
    if (cell) {
      const text = cell[0]
      // Avoid treating pure identifiers that look like A1 mid-name — CELL requires digits
      tokens.push({
        kind: "ref",
        text,
        refKey: normalizeRefKey(text),
      })
      i += text.length
      continue
    }

    const num = rest.match(NUMBER)
    if (num) {
      tokens.push({ kind: "number", text: num[0] })
      i += num[0].length
      continue
    }

    const ident = rest.match(IDENT)
    if (ident) {
      const text = ident[0]
      const upper = text.toUpperCase()
      // Function if known name, or name followed by (
      let j = i + text.length
      while (j < raw.length && /\s/.test(raw.charAt(j))) j++
      const followedByParen = raw.charAt(j) === "("
      if (fnSet.has(upper) || followedByParen) {
        tokens.push({ kind: "function", text })
      } else {
        tokens.push({ kind: "text", text })
      }
      i += text.length
      continue
    }

    const op = rest.match(OPS)
    if (op) {
      tokens.push({ kind: "op", text: op[0] })
      i += op[0].length
      continue
    }

    tokens.push({ kind: "text", text: ch })
    i += 1
  }

  return tokens
}

/** Map first-seen ref keys to palette indices. */
export function assignRefColors(
  tokens: readonly FormulaToken[]
): ReadonlyMap<string, string> {
  const map = new Map<string, string>()
  let n = 0
  for (const t of tokens) {
    if (t.kind !== "ref" || !t.refKey) continue
    if (map.has(t.refKey)) continue
    map.set(
      t.refKey,
      FORMULA_REF_COLORS[n % FORMULA_REF_COLORS.length]!
    )
    n += 1
  }
  return map
}

/**
 * Color only — never change weight/size/spacing.
 * Bold or different metrics make the mirror wider than the input and the
 * caret drifts left of the visible end of the formula.
 */
export function formulaTokenStyle(
  token: FormulaToken,
  refColors: ReadonlyMap<string, string>
): { color?: string } | undefined {
  switch (token.kind) {
    case "function":
      return { color: FORMULA_FUNCTION_COLOR }
    case "ref":
      return {
        color:
          (token.refKey && refColors.get(token.refKey)) ||
          FORMULA_REF_COLORS[0],
      }
    case "string":
      return { color: FORMULA_STRING_COLOR }
    case "number":
      return { color: FORMULA_NUMBER_COLOR }
    default:
      return undefined
  }
}
