/** Document mutations plugins send through `ctx.dispatch`. */

export type SpreadsheetCommand =
  | { readonly type: "setCell"; readonly row: number; readonly col: number; readonly raw: string }
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
