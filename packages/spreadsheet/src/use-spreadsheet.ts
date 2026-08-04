import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { HyperFormula } from "hyperformula"
import * as Y from "yjs"
import { toA1 } from "./address"
import type { SpreadsheetCommand } from "./commands"
import {
  addSheetInYDoc,
  createWorkbookUndoManager,
  deleteSheetInYDoc,
  ensureBoundsInYDoc,
  ensureWorkbookYDoc,
  materializeWorkbook,
  observeWorkbook,
  renameSheetInYDoc,
  reorderSheetsInYDoc,
  replaceWorkbookYDoc,
  setActiveSheetInYDoc,
  setCellInYDoc,
  setCellsInYDoc,
  setColWidthInYDoc,
  setRowHeightInYDoc,
  SS_ORIGIN_LOCAL,
  SS_ORIGIN_REMOTE,
  SS_ORIGIN_SYSTEM,
} from "./collab/yjs-workbook"
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
import { createEmptyWorkbook, getActiveSheet } from "./document"

export type UseSpreadsheetOptions = {
  readonly initial?: SpreadsheetDocument
  /**
   * Shared Y.Doc (collab). When omitted, a private doc is created.
   * All document state + undo live in this Y.Doc via {@link Y.UndoManager}.
   */
  readonly ydoc?: Y.Doc
  /** Merge consecutive local edits within this window (ms). Default 300. */
  readonly undoCaptureTimeout?: number
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
  readonly ensureBounds: (minRows: number, minCols: number) => void
  readonly setColWidth: (col: number, width: number) => void
  readonly setRowHeight: (row: number, height: number) => void
  readonly selectColumn: (col: number) => void
  readonly selectRow: (row: number) => void
  readonly selectAll: () => void
  readonly activeA1: string
  readonly replaceDocument: (doc: SpreadsheetDocument) => void
  readonly applyRemoteDocument: (doc: SpreadsheetDocument) => void
  readonly engine: HyperFormula
  readonly dispatch: (command: SpreadsheetCommand) => void
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly undo: () => void
  readonly redo: () => void
  readonly ydoc: Y.Doc
}

export function useSpreadsheet(
  options: UseSpreadsheetOptions = {}
): UseSpreadsheetApi {
  const externalYDoc = options.ydoc
  const initialSeed = options.initial
  const captureTimeout = options.undoCaptureTimeout ?? 300

  const ydocRef = useRef<Y.Doc | null>(null)
  const ownedDocRef = useRef<Y.Doc | null>(null)
  const undoManagerRef = useRef<Y.UndoManager | null>(null)
  const readyRef = useRef(false)

  const [document, setDocument] = useState<SpreadsheetDocument>(
    () => initialSeed ?? createEmptyWorkbook()
  )
  const [selection, setSelection] = useState<SpreadsheetSelection>({
    active: { row: 0, col: 0 },
    range: null,
  })
  const [formulaDraft, setFormulaDraft] = useState("")
  const [engineVersion, setEngineVersion] = useState(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const engineRef = useRef<HyperFormula | null>(null)
  if (!engineRef.current) {
    engineRef.current = createFormulaEngine(document)
  }

  const documentRef = useRef(document)
  documentRef.current = document
  const selectionRef = useRef(selection)
  selectionRef.current = selection

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

  const rebuildFromDoc = useCallback((doc: SpreadsheetDocument) => {
    engineRef.current?.destroy()
    engineRef.current = rebuildEngine(doc)
    setEngineVersion((v) => v + 1)
  }, [])

  /**
   * Single lifecycle for Y.Doc + UndoManager.
   * Empty deps: recreate only on Strict Mode remount / real unmount —
   * never mid-session (that was wiping the undo stack).
   */
  useEffect(() => {
    const ydoc = externalYDoc ?? new Y.Doc()
    if (!externalYDoc) {
      ensureWorkbookYDoc(ydoc, initialSeed, SS_ORIGIN_REMOTE)
      ownedDocRef.current = ydoc
    }
    ydocRef.current = ydoc

    const um = createWorkbookUndoManager(ydoc, { captureTimeout })
    undoManagerRef.current = um
    readyRef.current = true

    const syncStacks = () => {
      setCanUndo(um.undoStack.length > 0)
      setCanRedo(um.redoStack.length > 0)
    }
    um.on("stack-item-added", syncStacks)
    um.on("stack-item-popped", syncStacks)
    um.on("stack-cleared", syncStacks)
    syncStacks()

    const unsub = observeWorkbook(ydoc, (doc) => {
      setDocument(doc)
      documentRef.current = doc
      rebuildFromDoc(doc)
      syncDraftFromSelection(doc, selectionRef.current.active)
    })

    const initial = materializeWorkbook(ydoc)
    setDocument(initial)
    documentRef.current = initial
    rebuildFromDoc(initial)
    syncDraftFromSelection(initial, selectionRef.current.active)

    return () => {
      readyRef.current = false
      unsub()
      um.off("stack-item-added", syncStacks)
      um.off("stack-item-popped", syncStacks)
      um.off("stack-cleared", syncStacks)
      um.destroy()
      if (undoManagerRef.current === um) undoManagerRef.current = null
      if (ownedDocRef.current === ydoc) {
        ydoc.destroy()
        ownedDocRef.current = null
      }
      if (ydocRef.current === ydoc) ydocRef.current = null
    }
    // Intentionally mount-only (plus external ydoc identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- undo stack must survive re-renders
  }, [externalYDoc])

  const getYDoc = useCallback((): Y.Doc => {
    const d = ydocRef.current
    if (!d) {
      // Pre-effect or mid-teardown: use a throwaway so callers don't crash
      const tmp = new Y.Doc()
      ensureWorkbookYDoc(tmp, documentRef.current, SS_ORIGIN_REMOTE)
      return tmp
    }
    return d
  }, [])

  const activeSheetId = useCallback(() => {
    return materializeWorkbook(getYDoc()).activeSheetId
  }, [getYDoc])

  /** End the current undo capture group so the next edit is a separate step. */
  const stopCapturing = useCallback(() => {
    undoManagerRef.current?.stopCapturing()
  }, [])

  const replaceDocument = useCallback(
    (doc: SpreadsheetDocument) => {
      replaceWorkbookYDoc(getYDoc(), doc, SS_ORIGIN_REMOTE)
      undoManagerRef.current?.clear()
      setSelection({ active: { row: 0, col: 0 }, range: null })
    },
    [getYDoc]
  )

  const applyRemoteDocument = useCallback(
    (doc: SpreadsheetDocument) => {
      // Full structural replace — old undo ops point at deleted Y types and
      // would restore empty map keys ("positions") without text. Clear stack.
      replaceWorkbookYDoc(getYDoc(), doc, SS_ORIGIN_REMOTE)
      undoManagerRef.current?.clear()
      setCanUndo(false)
      setCanRedo(false)
    },
    [getYDoc]
  )

  const ensureBounds = useCallback(
    (minRows: number, minCols: number) => {
      const rows = Math.min(SHEET_MAX_ROWS, Math.max(1, Math.ceil(minRows)))
      const cols = Math.min(SHEET_MAX_COLS, Math.max(1, Math.ceil(minCols)))
      ensureBoundsInYDoc(
        getYDoc(),
        activeSheetId(),
        rows,
        cols,
        SS_ORIGIN_SYSTEM
      )
    },
    [activeSheetId, getYDoc]
  )

  const setColWidth = useCallback(
    (col: number, width: number) => {
      setColWidthInYDoc(
        getYDoc(),
        activeSheetId(),
        col,
        width,
        SS_ORIGIN_LOCAL
      )
      stopCapturing()
    },
    [activeSheetId, getYDoc, stopCapturing]
  )

  const setRowHeight = useCallback(
    (row: number, height: number) => {
      setRowHeightInYDoc(
        getYDoc(),
        activeSheetId(),
        row,
        height,
        SS_ORIGIN_LOCAL
      )
      stopCapturing()
    },
    [activeSheetId, getYDoc, stopCapturing]
  )

  const select = useCallback(
    (active: CellCoord, rangeEnd?: CellCoord | null) => {
      const needRows =
        Math.max(active.row, rangeEnd?.row ?? active.row) +
        1 +
        SHEET_GROW_BUFFER_ROWS
      const needCols =
        Math.max(active.col, rangeEnd?.col ?? active.col) +
        1 +
        SHEET_GROW_BUFFER_COLS
      ensureBounds(needRows, needCols)
      const doc = materializeWorkbook(getYDoc())
      syncDraftFromSelection(doc, active)
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
    [ensureBounds, getYDoc, syncDraftFromSelection]
  )

  const selectColumn = useCallback(
    (col: number) => {
      const doc = materializeWorkbook(getYDoc())
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
    [getYDoc, syncDraftFromSelection]
  )

  const selectRow = useCallback(
    (row: number) => {
      const doc = materializeWorkbook(getYDoc())
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
    [getYDoc, syncDraftFromSelection]
  )

  const selectAll = useCallback(() => {
    const doc = materializeWorkbook(getYDoc())
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
  }, [getYDoc, syncDraftFromSelection])

  const commitCell = useCallback(
    (row: number, col: number, raw: string) => {
      const ydoc = getYDoc()
      const sheetId = activeSheetId()
      setCellInYDoc(ydoc, sheetId, row, col, raw, { origin: SS_ORIGIN_LOCAL })
      stopCapturing()
      const doc = materializeWorkbook(ydoc)
      const sheet = getActiveSheet(doc)
      const hf = engineRef.current
      if (hf && sheet) {
        const ok = applyCellToEngine(hf, sheet.name, row, col, raw)
        if (!ok) rebuildFromDoc(doc)
        else setEngineVersion((v) => v + 1)
      }
      setFormulaDraft(raw)
    },
    [activeSheetId, getYDoc, rebuildFromDoc, stopCapturing]
  )

  const commitFormulaBar = useCallback(() => {
    const { row, col } = selectionRef.current.active
    commitCell(row, col, formulaDraft)
  }, [commitCell, formulaDraft])

  const setActiveSheet = useCallback(
    (sheetId: string) => {
      setActiveSheetInYDoc(getYDoc(), sheetId, SS_ORIGIN_LOCAL)
      stopCapturing()
    },
    [getYDoc, stopCapturing]
  )

  const addSheet = useCallback(() => {
    const ydoc = getYDoc()
    const doc = materializeWorkbook(ydoc)
    const n = doc.sheets.length + 1
    addSheetInYDoc(ydoc, `Sheet${n}`, SS_ORIGIN_LOCAL)
    stopCapturing()
    setSelection({ active: { row: 0, col: 0 }, range: null })
  }, [getYDoc, stopCapturing])

  const renameSheet = useCallback(
    (sheetId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      renameSheetInYDoc(getYDoc(), sheetId, trimmed, SS_ORIGIN_LOCAL)
      stopCapturing()
    },
    [getYDoc, stopCapturing]
  )

  const deleteSheet = useCallback(
    (sheetId: string): boolean => {
      const ok = deleteSheetInYDoc(getYDoc(), sheetId, SS_ORIGIN_LOCAL)
      if (ok) stopCapturing()
      return ok
    },
    [getYDoc, stopCapturing]
  )

  const reorderSheets = useCallback(
    (orderedIds: string[]) => {
      reorderSheetsInYDoc(getYDoc(), orderedIds, SS_ORIGIN_LOCAL)
      stopCapturing()
    },
    [getYDoc, stopCapturing]
  )

  const undo = useCallback(() => {
    undoManagerRef.current?.undo()
  }, [])

  const redo = useCallback(() => {
    undoManagerRef.current?.redo()
  }, [])

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

  const dispatch = useCallback(
    (command: SpreadsheetCommand) => {
      const ydoc = getYDoc()
      const sheetId = activeSheetId()
      switch (command.type) {
        case "setCell":
          commitCell(command.row, command.col, command.raw)
          break
        case "setCells":
          setCellsInYDoc(ydoc, sheetId, command.cells, SS_ORIGIN_LOCAL)
          stopCapturing()
          break
        case "setCellFormat":
          setCellInYDoc(
            ydoc,
            sheetId,
            command.row,
            command.col,
            materializeWorkbook(ydoc).sheets.find((s) => s.id === sheetId)
              ?.cells[`${command.row}:${command.col}`]?.raw ?? "",
            { format: command.format, origin: SS_ORIGIN_LOCAL }
          )
          stopCapturing()
          break
        case "setActiveSheet":
          setActiveSheet(command.sheetId)
          break
        case "addSheet":
          addSheet()
          break
        case "renameSheet":
          renameSheet(command.sheetId, command.name)
          break
        case "deleteSheet":
          deleteSheet(command.sheetId)
          break
        case "reorderSheets":
          reorderSheets([...command.orderedIds])
          break
        case "setColWidth":
          setColWidth(command.col, command.width)
          break
        case "setRowHeight":
          setRowHeight(command.row, command.height)
          break
        case "ensureBounds":
          ensureBounds(command.minRows, command.minCols)
          break
        case "undo":
          undo()
          break
        case "redo":
          redo()
          break
        default: {
          const _exhaustive: never = command
          void _exhaustive
        }
      }
    },
    [
      activeSheetId,
      addSheet,
      commitCell,
      deleteSheet,
      ensureBounds,
      getYDoc,
      redo,
      renameSheet,
      reorderSheets,
      setActiveSheet,
      setColWidth,
      setRowHeight,
      stopCapturing,
      undo,
    ]
  )

  // Stable empty doc for API surface before effect (SSR / first paint)
  const ydocOut = ydocRef.current ?? ownedDocRef.current

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
    applyRemoteDocument,
    engine: engineRef.current!,
    dispatch,
    canUndo,
    canRedo,
    undo,
    redo,
    ydoc: ydocOut as Y.Doc,
  }
}
