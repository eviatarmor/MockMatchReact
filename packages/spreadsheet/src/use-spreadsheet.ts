import { useCallback, useMemo, useRef, useState } from "react"
import type { HyperFormula } from "hyperformula"
import { toA1 } from "./address"
import {
  cloneDocument,
  createEmptySheet,
  createEmptyWorkbook,
  getActiveSheet,
  setCellRaw,
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

  const select = useCallback(
    (active: CellCoord, rangeEnd?: CellCoord | null) => {
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
      setDocument((doc) => {
        syncDraftFromSelection(doc, active)
        return doc
      })
    },
    [syncDraftFromSelection]
  )

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
    activeA1,
    replaceDocument,
    engine: engineRef.current!,
  }
}
