/**
 * Product-agnostic multi-sheet spreadsheet shell.
 * Host supplies chrome, i18n labels, persistence, and collab room.
 */

export {
  SpreadsheetShell,
  type SpreadsheetShellProps,
} from "./spreadsheet-shell"
export { FormulaBar, type FormulaBarProps } from "./formula-bar"
export { FormulaInput, type FormulaInputProps } from "./formula-input"
export {
  getFormulaFunctionNames,
  getFormulaFunctionNameSet,
  getFormulaFunctionSuggestions,
  getFormulaFunctionQuery,
} from "./formula/functions"
export {
  tokenizeFormula,
  assignRefColors,
  FORMULA_REF_COLORS,
  FORMULA_FUNCTION_COLOR,
  type FormulaToken,
  type FormulaTokenKind,
} from "./formula/tokenize"
export { FormulaHighlight } from "./formula/highlight"
export { SheetTabs, type SheetTabsProps } from "./sheet-tabs"
export {
  SpreadsheetGrid,
  type SpreadsheetGridProps,
} from "./grid/spreadsheet-grid"
export {
  useSpreadsheet,
  type UseSpreadsheetOptions,
  type UseSpreadsheetApi,
} from "./use-spreadsheet"
export {
  createEmptyWorkbook,
  createEmptySheet,
  getActiveSheet,
  getCellRaw,
  setCellRaw,
  setColWidth,
  setRowHeight,
  ensureSheetDimensions,
  updateSheet,
  cloneDocument,
  newSheetId,
} from "./document"
export {
  getColWidth,
  getRowHeight,
  buildColLayout,
  buildRowLayout,
  findIndexAtOffset,
  visibleRange,
} from "./layout"
export {
  colToLetter,
  letterToCol,
  toA1,
  parseA1,
  cellKey,
  parseCellKey,
  normalizeRange,
  inRange,
} from "./address"
export {
  createFormulaEngine,
  getDisplayCell,
  applyCellToEngine,
  rebuildEngine,
} from "./formula/engine"
export {
  materializeWorkbook,
  ensureWorkbookYDoc,
  replaceWorkbookYDoc,
  setCellInYDoc,
  setCellsInYDoc,
  observeWorkbook,
  createWorkbookUndoManager,
  SS_ORIGIN_LOCAL,
  SS_ORIGIN_REMOTE,
  SS_ORIGIN_SYSTEM,
} from "./collab/yjs-workbook"
export type {
  SpreadsheetCell,
  SpreadsheetSheet,
  SpreadsheetDocument,
  CellCoord,
  CellRange,
  SpreadsheetSelection,
  DisplayCell,
  SpreadsheetShellLabels,
  NumberFormatId,
} from "./types"
export { formatNumberValue } from "./format/number-format"
export {
  adjustFormulaRefs,
  copyCellRawWithOffset,
} from "./formula/adjust-refs"
export {
  DEFAULT_ROW_COUNT,
  DEFAULT_COL_COUNT,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_COL_WIDTH,
  MIN_COL_WIDTH,
  MAX_COL_WIDTH,
  MIN_ROW_HEIGHT,
  MAX_ROW_HEIGHT,
  ROW_HEADER_WIDTH,
  COL_HEADER_HEIGHT,
  SHEET_GROW_BUFFER_ROWS,
  SHEET_GROW_BUFFER_COLS,
  SHEET_MAX_ROWS,
  SHEET_MAX_COLS,
} from "./types"

export type { SpreadsheetCommand } from "./commands"

export type {
  CellRect,
  SpreadsheetChromeSlot,
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
  SpreadsheetPointerDownEvent,
  SpreadsheetPointerMoveEvent,
  SpreadsheetPointerTarget,
  SpreadsheetPointerUpEvent,
} from "./plugin-system"

export {
  collectChrome,
  runPluginKeyDown,
  runPluginPointerDown,
  runPluginPointerMove,
  runPluginPointerUp,
  sortPlugins,
} from "./plugin-system"

export {
  createDefaultPlugins,
  createHistoryPlugin,
  createSelectionPlugin,
  createFillPlugin,
  fillDownFromHandle,
  createKeyboardPlugin,
  createCellEditPlugin,
  createResizePlugin,
  createFormulaBarPlugin,
  createSheetTabsPlugin,
  createFormatPlugin,
  createClipboardPlugin,
} from "./plugins"
