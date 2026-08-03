export type SpreadsheetCell = {
  /** User-authored content: literal or formula starting with `=`. */
  readonly raw: string
}

export type SpreadsheetSheet = {
  readonly id: string
  readonly name: string
  /** Sparse map keyed by `row:col` (0-based). */
  readonly cells: Readonly<Record<string, SpreadsheetCell>>
  readonly rowCount: number
  readonly colCount: number
}

export type SpreadsheetDocument = {
  readonly version: 1
  readonly sheets: readonly SpreadsheetSheet[]
  readonly activeSheetId: string
}

export type CellCoord = {
  readonly row: number
  readonly col: number
}

export type CellRange = {
  readonly start: CellCoord
  readonly end: CellCoord
}

export type SpreadsheetSelection = {
  readonly active: CellCoord
  readonly range: CellRange | null
}

export type DisplayCell = {
  readonly raw: string
  readonly display: string
  readonly isFormula: boolean
  readonly error: string | null
}

export type SpreadsheetShellLabels = {
  readonly formulaBarAria: string
  readonly nameBoxAria: string
  readonly gridAria: string
  readonly sheetTabsAria: string
  readonly addSheet: string
  readonly renameSheet: string
  readonly deleteSheet: string
  readonly sheetFallback: (n: number) => string
  readonly cannotDeleteLastSheet: string
}

export const DEFAULT_ROW_COUNT = 100
export const DEFAULT_COL_COUNT = 26
export const DEFAULT_ROW_HEIGHT = 28
export const DEFAULT_COL_WIDTH = 100
export const ROW_HEADER_WIDTH = 48
export const COL_HEADER_HEIGHT = 28
