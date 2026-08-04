import type { CellStyle, NumberFormatId } from "./types"

/** Document mutations plugins send through `ctx.dispatch`. */

export type CellWrite = {
  readonly row: number
  readonly col: number
  readonly raw: string
  /** When set, updates format; omit to leave format unchanged. */
  readonly format?: NumberFormatId | null
  /** When set, replaces style; null clears; omit leaves style unchanged. */
  readonly style?: CellStyle | null
}

export type SpreadsheetCommand =
  | { readonly type: "setCell"; readonly row: number; readonly col: number; readonly raw: string }
  | {
      readonly type: "setCells"
      readonly cells: readonly CellWrite[]
    }
  | {
      readonly type: "setCellFormat"
      readonly row: number
      readonly col: number
      readonly format: NumberFormatId | null
    }
  | {
      readonly type: "setCellStyle"
      readonly row: number
      readonly col: number
      /** Patch merged onto existing style; null clears all style. */
      readonly style: CellStyle | null
    }
  | {
      readonly type: "setStyles"
      /** Apply the same style patch to every cell in the inclusive range. */
      readonly startRow: number
      readonly startCol: number
      readonly endRow: number
      readonly endCol: number
      readonly style: CellStyle | null
    }
  | { readonly type: "insertRows"; readonly at: number; readonly count?: number }
  | { readonly type: "deleteRows"; readonly at: number; readonly count?: number }
  | { readonly type: "insertCols"; readonly at: number; readonly count?: number }
  | { readonly type: "deleteCols"; readonly at: number; readonly count?: number }
  | { readonly type: "setActiveSheet"; readonly sheetId: string }
  | { readonly type: "addSheet" }
  | { readonly type: "renameSheet"; readonly sheetId: string; readonly name: string }
  | { readonly type: "deleteSheet"; readonly sheetId: string }
  | { readonly type: "reorderSheets"; readonly orderedIds: readonly string[] }
  | { readonly type: "setColWidth"; readonly col: number; readonly width: number }
  | { readonly type: "setRowHeight"; readonly row: number; readonly height: number }
  | {
      readonly type: "ensureBounds"
      readonly minRows: number
      readonly minCols: number
    }
  | { readonly type: "undo" }
  | { readonly type: "redo" }
