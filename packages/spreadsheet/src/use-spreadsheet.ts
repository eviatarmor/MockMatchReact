import { useCallback, useMemo, useRef, useState } from "react"
import type { HyperFormula } from "hyperformula"
import { toA1 } from "./address"
import {
  cloneDocument,
  createEmptySheet,
  createEmptyWorkbook,
  ensureSheetDimensions,
  getActiveSheet,
  setCellRaw,
  setColWidth as setSheetColWidth,
  setRowHeight as setSheetRowHeight,
  updateSheet,
} from "./document"
import {
  applyCellToEngine,
  createFormulaEngine,
  getDisplayCell,
  rebuildEngine,
} from "./formula/engine"
import type {
  CellCoord,
  DisplayCell,
  SpreadsheetDocument,
  SpreadsheetSelection,
} from "./types"
import {
  SHEET_GROW_BUFFER_COLS,
  SHEET_GROW_BUFFER_ROWS,
  SHEET_MAX_COLS,
  SHEET_MAX_ROWS,
} from "./types"

export type UseSpreadsheetOptions = {
  readonly initial?: SpreadsheetDocument
}

export type UseSpreadsheetApi = {
  readonly document: SpreadsheetDocument
  readonly selection: SpreadsheetSelection
  readonly formulaDraft: string
  readonly setFormulaDraft: (v: string) => void
  readonly select: (active: CellCoord, rangeEnd?: CellCoord | null) => void
  readonly commitCell: (row: number, col: number, raw: string) => void
  readonly commitFormulaBar: () => void
  readonly setActiveSheet: (sheetId: string) => void
  readonly addSheet: () => void
  readonly renameSheet: (sheetId: string, name: string) => void
  readonly deleteSheet: (sheetId: string) => boolean
  readonly reorderSheets: (orderedIds: string[]) => void
  readonly getDisplay: (row: number, col: number) => DisplayCell
  /**
   * Grow active sheet so at least `minRows` × `minCols` exist (capped).
   * Used by the grid for infinite-scroll / keyboard navigation.
   */
  readonly ensureBounds: (minRows: number, minCols: number) => void
  readonly setColWidth: (col: number, width: number) => void
  readonly setRowHeight: (row: number, height: number) => void
  readonly selectColumn: (col: number) => void
  readonly selectRow: (row: number) => void
  readonly selectAll: () => void
  readonly activeA1: string
  readonly replaceDocument: (doc: SpreadsheetDocument) => void
  readonly engine: HyperFormula
}

export function useSpreadsheet(
  options: UseSpreadsheetOptions = {}
): UseSpreadsheetApi {
  const [document, setDocument] = useState<SpreadsheetDocument>(
    () => options.initial ?? createEmptyWorkbook()
  )
  const [selection, setSelection] = useState<SpreadsheetSelection>({
    active: { row: 0, col: 0 },
    range: null,
  })
  const [formulaDraft, setFormulaDraft] = useState("")
  const [engineVersion, setEngineVersion] = useState(0)

  const engineRef = useRef<HyperFormula | null>(null)
  if (!engineRef.current) {
    engineRef.current = createFormulaEngine(document)
  }
  const documentRef = useRef(document)
  documentRef.current = document

  // Keep formula bar in sync when selection changes (caller also sets draft)
  const syncDraftFromSelection = useCallback(
    (doc: SpreadsheetDocument, active: CellCoord) => {
      const sheet = getActiveSheet(doc)
      if (!sheet) {
        setFormulaDraft("")
        return
      }
      const raw = sheet.cells[`${active.row}:${active.col}`]?.raw ?? ""
      setFormulaDraft(raw)
    },
    []
  )

  const bumpEngine = useCallback(() => {
    setEngineVersion((v) => v + 1)
  }, [])

  const replaceDocument = useCallback(
    (doc: SpreadsheetDocument) => {
      const next = cloneDocument(doc)
      engineRef.current?.destroy()
      engineRef.current = rebuildEngine(next)
      setDocument(next)
      setSelection({ active: { row: 0, col: 0 }, range: null })
      syncDraftFromSelection(next, { row: 0, col: 0 })
      bumpEngine()
    },
    [bumpEngine, syncDraftFromSelection]
  )

  const ensureBounds = useCallback((minRows: number, minCols: number) => {
    const rows = Math.min(SHEET_MAX_ROWS, Math.max(1, Math.ceil(minRows)))
    const cols = Math.min(SHEET_MAX_COLS, Math.max(1, Math.ceil(minCols)))
    setDocument((doc) => {
      const sheet = getActiveSheet(doc)
      if (!sheet) return doc
      if (sheet.rowCount >= rows && sheet.colCount >= cols) return doc
      return updateSheet(doc, sheet.id, (s) =>
        ensureSheetDimensions(s, rows, cols)
      )
    })
  }, [])

  const setColWidth = useCallback((col: number, width: number) => {
    setDocument((doc) => {
      const sheet = getActiveSheet(doc)
      if (!sheet) return doc
      return updateSheet(doc, sheet.id, (s) => setSheetColWidth(s, col, width))
    })
  }, [])

  const setRowHeight = useCallback((row: number, height: number) => {
    setDocument((doc) => {
      const sheet = getActiveSheet(doc)
      if (!sheet) return doc
      return updateSheet(doc, sheet.id, (s) => setSheetRowHeight(s, row, height))
    })
  }, [])

  const select = useCallback(
    (active: CellCoord, rangeEnd?: CellCoord | null) => {
      // Grow sheet when selection lands past the edge (infinite grid).
      const needRows =
        Math.max(active.row, rangeEnd?.row ?? active.row) +
        1 +
        SHEET_GROW_BUFFER_ROWS
      const needCols =
        Math.max(active.col, rangeEnd?.col ?? active.col) +
        1 +
        SHEET_GROW_BUFFER_COLS
      setDocument((doc) => {
        const sheet = getActiveSheet(doc)
        if (!sheet) {
          syncDraftFromSelection(doc, active)
          return doc
        }
        const nextDoc =
          sheet.rowCount < needRows || sheet.colCount < needCols
            ? updateSheet(doc, sheet.id, (s) =>
                ensureSheetDimensions(s, needRows, needCols)
              )
            : doc
        syncDraftFromSelection(nextDoc, active)
        return nextDoc
      })
      setSelection({
        active,
        range:
          rangeEnd &&
          (rangeEnd.row !== active.row || rangeEnd.col !== active.col)
            ? {
                start: {
                  row: Math.min(active.row, rangeEnd.row),
                  col: Math.min(active.col, rangeEnd.col),
                },
                end: {
                  row: Math.max(active.row, rangeEnd.row),
                  col: Math.max(active.col, rangeEnd.col),
                },
              }
            : null,
      })
    },
    [syncDraftFromSelection]
  )

  const selectColumn = useCallback(
    (col: number) => {
      const doc = documentRef.current
      const sheet = getActiveSheet(doc)
      if (!sheet) return
      const lastRow = Math.max(0, sheet.rowCount - 1)
      const active = { row: 0, col }
      setSelection({
        active,
        range: {
          start: { row: 0, col },
          end: { row: lastRow, col },
        },
      })
      syncDraftFromSelection(doc, active)
    },
    [syncDraftFromSelection]
  )

  const selectRow = useCallback(
    (row: number) => {
      const doc = documentRef.current
      const sheet = getActiveSheet(doc)
      if (!sheet) return
      const lastCol = Math.max(0, sheet.colCount - 1)
      const active = { row, col: 0 }
      setSelection({
        active,
        range: {
          start: { row, col: 0 },
          end: { row, col: lastCol },
        },
      })
      syncDraftFromSelection(doc, active)
    },
    [syncDraftFromSelection]
  )

  const selectAll = useCallback(() => {
    const doc = documentRef.current
    const sheet = getActiveSheet(doc)
    if (!sheet) return
    const lastRow = Math.max(0, sheet.rowCount - 1)
    const lastCol = Math.max(0, sheet.colCount - 1)
    const active = { row: 0, col: 0 }
    setSelection({
      active,
      range: {
        start: { row: 0, col: 0 },
        end: { row: lastRow, col: lastCol },
      },
    })
    syncDraftFromSelection(doc, active)
  }, [syncDraftFromSelection])

  const commitCell = useCallback(
    (row: number, col: number, raw: string) => {
      setDocument((doc) => {
        const sheet = getActiveSheet(doc)
        if (!sheet) return doc
        const nextSheet = setCellRaw(sheet, row, col, raw)
        const next = updateSheet(doc, sheet.id, () => nextSheet)
        const hf = engineRef.current
        if (hf) {
          const ok = applyCellToEngine(hf, nextSheet.name, row, col, raw)
          if (!ok) {
            engineRef.current?.destroy()
            engineRef.current = rebuildEngine(next)
          }
        }
        bumpEngine()
        return next
      })
      setFormulaDraft(raw)
    },
    [bumpEngine]
  )

  const commitFormulaBar = useCallback(() => {
    const { row, col } = selection.active
    commitCell(row, col, formulaDraft)
  }, [commitCell, formulaDraft, selection.active])

  const setActiveSheet = useCallback(
    (sheetId: string) => {
      setDocument((doc) => {
        if (!doc.sheets.some((s) => s.id === sheetId)) return doc
        const next = { ...doc, activeSheetId: sheetId }
        syncDraftFromSelection(next, selection.active)
        return next
      })
    },
    [selection.active, syncDraftFromSelection]
  )

  const addSheet = useCallback(() => {
    setDocument((doc) => {
      const n = doc.sheets.length + 1
      const sheet = createEmptySheet(`Sheet${n}`)
      const next: SpreadsheetDocument = {
        ...doc,
        sheets: [...doc.sheets, sheet],
        activeSheetId: sheet.id,
      }
      engineRef.current?.destroy()
      engineRef.current = rebuildEngine(next)
      bumpEngine()
      syncDraftFromSelection(next, { row: 0, col: 0 })
      return next
    })
    setSelection({ active: { row: 0, col: 0 }, range: null })
  }, [bumpEngine, syncDraftFromSelection])

  const renameSheet = useCallback(
    (sheetId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setDocument((doc) => {
        const next = updateSheet(doc, sheetId, (s) => ({ ...s, name: trimmed }))
        engineRef.current?.destroy()
        engineRef.current = rebuildEngine(next)
        bumpEngine()
        return next
      })
    },
    [bumpEngine]
  )

  const deleteSheet = useCallback(
    (sheetId: string): boolean => {
      let ok = false
      setDocument((doc) => {
        if (doc.sheets.length <= 1) return doc
        if (!doc.sheets.some((s) => s.id === sheetId)) return doc
        const sheets = doc.sheets.filter((s) => s.id !== sheetId)
        const activeSheetId =
          doc.activeSheetId === sheetId
            ? sheets[0]!.id
            : doc.activeSheetId
        const next: SpreadsheetDocument = {
          ...doc,
          sheets,
          activeSheetId,
        }
        engineRef.current?.destroy()
        engineRef.current = rebuildEngine(next)
        bumpEngine()
        ok = true
        return next
      })
      return ok
    },
    [bumpEngine]
  )

  const reorderSheets = useCallback(
    (orderedIds: string[]) => {
      setDocument((doc) => {
        const map = new Map(doc.sheets.map((s) => [s.id, s]))
        const sheets = orderedIds
          .map((id) => map.get(id))
          .filter((s): s is NonNullable<typeof s> => Boolean(s))
        if (sheets.length !== doc.sheets.length) return doc
        return { ...doc, sheets }
      })
    },
    []
  )

  const getDisplay = useCallback(
    (row: number, col: number): DisplayCell => {
      void engineVersion
      const sheet = getActiveSheet(document)
      const hf = engineRef.current
      if (!sheet || !hf) {
        return { raw: "", display: "", isFormula: false, error: null }
      }
      return getDisplayCell(hf, sheet, row, col)
    },
    [document, engineVersion]
  )

  const activeA1 = useMemo(
    () => toA1(selection.active.row, selection.active.col),
    [selection.active.col, selection.active.row]
  )

  return {
    document,
    selection,
    formulaDraft,
    setFormulaDraft,
    select,
    commitCell,
    commitFormulaBar,
    setActiveSheet,
    addSheet,
    renameSheet,
    deleteSheet,
    reorderSheets,
    getDisplay,
    ensureBounds,
    setColWidth,
    setRowHeight,
    selectColumn,
    selectRow,
    selectAll,
    activeA1,
    replaceDocument,
    engine: engineRef.current!,
  }
}
