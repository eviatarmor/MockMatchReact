/** Display format for numeric cell values (Excel-ish subset). */
export type NumberFormatId =
  | "general"
  | "number"
  | "percent"
  | "currency"
  | "integer"

export type CellAlign = "left" | "center" | "right"

/** Lightweight cell presentation (not rich text). */
export type CellStyle = {
  readonly bold?: boolean
  readonly italic?: boolean
  readonly underline?: boolean
  readonly align?: CellAlign
  /** CSS color for background fill. */
  readonly fill?: string
  /** CSS color for text. */
  readonly color?: string
  readonly wrap?: boolean
}

export type SpreadsheetCell = {
  /** User-authored content: literal or formula starting with `=`. */
  readonly raw: string
  /** Optional number display format (does not change stored raw). */
  readonly format?: NumberFormatId
  /** Optional presentation style. */
  readonly style?: CellStyle
}

export type SpreadsheetSheet = {
  readonly id: string
  readonly name: string
  /** Sparse map keyed by `row:col` (0-based). */
  readonly cells: Readonly<Record<string, SpreadsheetCell>>
  readonly rowCount: number
  readonly colCount: number
  /** Sparse col index (string) → width px. Missing → DEFAULT_COL_WIDTH. */
  readonly colWidths?: Readonly<Record<string, number>>
  /** Sparse row index (string) → height px. Missing → DEFAULT_ROW_HEIGHT. */
  readonly rowHeights?: Readonly<Record<string, number>>
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
  readonly format?: NumberFormatId
  readonly style?: CellStyle
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
  /** Optional chrome for format toolbar / context menu (English fallbacks). */
  readonly toolbarAria?: string
  readonly bold?: string
  readonly italic?: string
  readonly underline?: string
  readonly alignLeft?: string
  readonly alignCenter?: string
  readonly alignRight?: string
  readonly wrapText?: string
  readonly fillColor?: string
  readonly formatGeneral?: string
  readonly formatNumber?: string
  readonly formatPercent?: string
  readonly formatCurrency?: string
  readonly formatInteger?: string
  readonly insertRow?: string
  readonly deleteRow?: string
  readonly insertCol?: string
  readonly deleteCol?: string
  readonly clearContents?: string
  readonly cut?: string
  readonly copy?: string
  readonly paste?: string
}

/** Starting grid size (grows as user scrolls / navigates). */
export const DEFAULT_ROW_COUNT = 80
export const DEFAULT_COL_COUNT = 26
export const DEFAULT_ROW_HEIGHT = 28
export const DEFAULT_COL_WIDTH = 100
export const MIN_COL_WIDTH = 36
export const MAX_COL_WIDTH = 640
export const MIN_ROW_HEIGHT = 18
export const MAX_ROW_HEIGHT = 200
export const ROW_HEADER_WIDTH = 48
export const COL_HEADER_HEIGHT = 28

/** Extra empty rows/cols kept past the viewport edge (infinite feel). */
export const SHEET_GROW_BUFFER_ROWS = 40
export const SHEET_GROW_BUFFER_COLS = 10
/** Hard caps so scroll size / HyperFormula stay bounded. */
export const SHEET_MAX_ROWS = 10_000
export const SHEET_MAX_COLS = 500
