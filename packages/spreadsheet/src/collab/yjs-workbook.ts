import * as Y from "yjs"
import { cellKey } from "../address"
import { createEmptyWorkbook, newSheetId } from "../document"
import type {
  NumberFormatId,
  SpreadsheetCell,
  SpreadsheetDocument,
  SpreadsheetSheet,
} from "../types"
import { SS_ORIGIN_LOCAL, SS_ORIGIN_REMOTE, SS_ORIGIN_SYSTEM } from "./origins"

function rootMap(ydoc: Y.Doc): Y.Map<unknown> {
  return ydoc.getMap("spreadsheet")
}

function sheetMap(ydoc: Y.Doc, sheetId: string): Y.Map<unknown> | undefined {
  return rootMap(ydoc).get(`sheet:${sheetId}`) as Y.Map<unknown> | undefined
}

/** Cell body is Y.Text so UndoManager restores string content, not just keys. */
function cellsMap(sm: Y.Map<unknown>): Y.Map<unknown> {
  let cells = sm.get("cells") as Y.Map<unknown> | undefined
  if (!cells) {
    cells = new Y.Map<unknown>()
    sm.set("cells", cells)
  }
  return cells
}

function formatsMap(sm: Y.Map<unknown>): Y.Map<string> {
  let formats = sm.get("formats") as Y.Map<string> | undefined
  if (!formats) {
    formats = new Y.Map<string>()
    sm.set("formats", formats)
  }
  return formats
}

function readCellRaw(value: unknown): string {
  if (value instanceof Y.Text) return value.toString()
  if (typeof value === "string") return value
  return ""
}

/** Write / clear a cell raw value using Y.Text (undo-friendly). Must run inside a Y.transact. */
function writeCellRaw(cells: Y.Map<unknown>, key: string, raw: string): void {
  if (raw === "") {
    cells.delete(key)
    return
  }
  const existing = cells.get(key)
  if (existing instanceof Y.Text) {
    const cur = existing.toString()
    if (cur === raw) return
    // In-place text edit so UndoManager records content, not only map keys
    if (existing.length > 0) existing.delete(0, existing.length)
    if (raw.length > 0) existing.insert(0, raw)
    return
  }
  // New cell or migrate legacy plain-string → Y.Text
  const t = new Y.Text()
  if (raw.length > 0) t.insert(0, raw)
  cells.set(key, t)
}

/**
 * Materialize a durable workbook from a Y.Doc.
 *
 * ```
 * ydoc.getMap("spreadsheet")
 *   meta: { activeSheetId, version }
 *   sheetOrder: Y.Array<string>
 *   sheet:<id>: Y.Map { name, rowCount, colCount, cells, formats, colWidths, rowHeights }
 * ```
 */
export function materializeWorkbook(ydoc: Y.Doc): SpreadsheetDocument {
  const root = rootMap(ydoc)
  const order = root.get("sheetOrder") as Y.Array<string> | undefined
  if (!order || order.length === 0) {
    return createEmptyWorkbook()
  }

  const sheets: SpreadsheetSheet[] = []
  for (const id of order.toArray()) {
    const sm = root.get(`sheet:${id}`) as Y.Map<unknown> | undefined
    if (!sm) continue
    const cellsMapY = sm.get("cells") as Y.Map<unknown> | undefined
    const formatsMapY = sm.get("formats") as Y.Map<string> | undefined
    const cells: Record<string, SpreadsheetCell> = {}
    cellsMapY?.forEach((value, key) => {
      const raw = readCellRaw(value)
      if (raw !== "") {
        const fmt = formatsMapY?.get(key)
        cells[key] = fmt
          ? { raw, format: fmt as NumberFormatId }
          : { raw }
      }
    })
    // Format-only keys (empty raw) still materialize
    formatsMapY?.forEach((fmt, key) => {
      if (!cells[key] && fmt) {
        cells[key] = { raw: "", format: fmt as NumberFormatId }
      }
    })
    const colWidthsMap = sm.get("colWidths") as Y.Map<number> | undefined
    const rowHeightsMap = sm.get("rowHeights") as Y.Map<number> | undefined
    const colWidths: Record<string, number> = {}
    const rowHeights: Record<string, number> = {}
    colWidthsMap?.forEach((w, key) => {
      if (typeof w === "number" && w > 0) colWidths[key] = w
    })
    rowHeightsMap?.forEach((h, key) => {
      if (typeof h === "number" && h > 0) rowHeights[key] = h
    })
    sheets.push({
      id,
      name: String(sm.get("name") ?? "Sheet"),
      rowCount: Number(sm.get("rowCount") ?? 100),
      colCount: Number(sm.get("colCount") ?? 26),
      cells,
      ...(Object.keys(colWidths).length > 0 ? { colWidths } : {}),
      ...(Object.keys(rowHeights).length > 0 ? { rowHeights } : {}),
    })
  }

  if (sheets.length === 0) return createEmptyWorkbook()

  const meta = root.get("meta") as { activeSheetId?: string } | undefined
  const activeSheetId =
    meta?.activeSheetId && sheets.some((s) => s.id === meta.activeSheetId)
      ? meta.activeSheetId
      : sheets[0]!.id

  return { version: 1, sheets, activeSheetId }
}

/** Seed empty Y.Doc from a plain workbook (no-op if already populated). */
export function ensureWorkbookYDoc(
  ydoc: Y.Doc,
  seed?: SpreadsheetDocument,
  origin: unknown = SS_ORIGIN_REMOTE
): void {
  const root = rootMap(ydoc)
  const order = root.get("sheetOrder") as Y.Array<string> | undefined
  if (order && order.length > 0) return

  const doc = seed ?? createEmptyWorkbook()
  ydoc.transact(() => {
    writeWorkbookIntoRoot(root, doc)
  }, origin)
}

/** Replace entire workbook content (clear stacks via remote origin if needed). */
export function replaceWorkbookYDoc(
  ydoc: Y.Doc,
  doc: SpreadsheetDocument,
  origin: unknown = SS_ORIGIN_LOCAL
): void {
  ydoc.transact(() => {
    const root = rootMap(ydoc)
    const keys: string[] = []
    root.forEach((_, k) => keys.push(k))
    for (const k of keys) root.delete(k)
    writeWorkbookIntoRoot(root, doc)
  }, origin)
}

function writeWorkbookIntoRoot(
  root: Y.Map<unknown>,
  doc: SpreadsheetDocument
): void {
  const sheetOrder = new Y.Array<string>()
  root.set("sheetOrder", sheetOrder)
  root.set("meta", {
    version: 1,
    activeSheetId: doc.activeSheetId,
  })
  for (const sheet of doc.sheets) {
    sheetOrder.push([sheet.id])
    root.set(`sheet:${sheet.id}`, sheetToYMap(sheet))
  }
}

function sheetToYMap(sheet: SpreadsheetSheet): Y.Map<unknown> {
  const sm = new Y.Map<unknown>()
  sm.set("name", sheet.name)
  sm.set("rowCount", sheet.rowCount)
  sm.set("colCount", sheet.colCount)
  const cells = new Y.Map<unknown>()
  const formats = new Y.Map<string>()
  for (const [k, v] of Object.entries(sheet.cells)) {
    if (v.raw !== "") {
      const t = new Y.Text()
      t.insert(0, v.raw)
      cells.set(k, t)
    }
    if (v.format) formats.set(k, v.format)
  }
  sm.set("cells", cells)
  sm.set("formats", formats)
  if (sheet.colWidths) {
    const cw = new Y.Map<number>()
    for (const [k, v] of Object.entries(sheet.colWidths)) cw.set(k, v)
    sm.set("colWidths", cw)
  }
  if (sheet.rowHeights) {
    const rh = new Y.Map<number>()
    for (const [k, v] of Object.entries(sheet.rowHeights)) rh.set(k, v)
    sm.set("rowHeights", rh)
  }
  return sm
}

export function setCellInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  row: number,
  col: number,
  raw: string,
  opts?: { format?: NumberFormatId | null; origin?: unknown }
): void {
  const sm = sheetMap(ydoc, sheetId)
  if (!sm) return
  const key = cellKey(row, col)
  const origin = opts?.origin ?? SS_ORIGIN_LOCAL
  ydoc.transact(() => {
    const cells = cellsMap(sm)
    const formats = formatsMap(sm)
    writeCellRaw(cells, key, raw)
    if (opts?.format === null) formats.delete(key)
    else if (opts?.format !== undefined) formats.set(key, opts.format)
    // grow bounds only when needed (avoids noisy undo of dimensions alone)
    const rr = Number(sm.get("rowCount") ?? 1)
    const cc = Number(sm.get("colCount") ?? 1)
    if (row + 1 > rr) sm.set("rowCount", row + 1)
    if (col + 1 > cc) sm.set("colCount", col + 1)
  }, origin)
}

export function setCellsInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  writes: readonly {
    row: number
    col: number
    raw: string
    format?: NumberFormatId | null
  }[],
  origin: unknown = SS_ORIGIN_LOCAL
): void {
  const sm = sheetMap(ydoc, sheetId)
  if (!sm || writes.length === 0) return
  ydoc.transact(() => {
    const cells = cellsMap(sm)
    const formats = formatsMap(sm)
    let maxR = Number(sm.get("rowCount") ?? 1)
    let maxC = Number(sm.get("colCount") ?? 1)
    let grew = false
    for (const w of writes) {
      const key = cellKey(w.row, w.col)
      writeCellRaw(cells, key, w.raw)
      if (w.format === null) formats.delete(key)
      else if (w.format !== undefined) formats.set(key, w.format)
      if (w.row + 1 > maxR) {
        maxR = w.row + 1
        grew = true
      }
      if (w.col + 1 > maxC) {
        maxC = w.col + 1
        grew = true
      }
    }
    if (grew) {
      sm.set("rowCount", maxR)
      sm.set("colCount", maxC)
    }
  }, origin)
}

export function setActiveSheetInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  origin: unknown = SS_ORIGIN_LOCAL
): void {
  ydoc.transact(() => {
    const root = rootMap(ydoc)
    const meta = { ...(root.get("meta") as object), activeSheetId: sheetId, version: 1 }
    root.set("meta", meta)
  }, origin)
}

export function addSheetInYDoc(
  ydoc: Y.Doc,
  name: string,
  origin: unknown = SS_ORIGIN_LOCAL
): string {
  const id = newSheetId()
  ydoc.transact(() => {
    const root = rootMap(ydoc)
    let order = root.get("sheetOrder") as Y.Array<string> | undefined
    if (!order) {
      order = new Y.Array<string>()
      root.set("sheetOrder", order)
    }
    order.push([id])
    root.set(
      `sheet:${id}`,
      sheetToYMap({
        id,
        name,
        cells: {},
        rowCount: 80,
        colCount: 26,
      })
    )
    root.set("meta", {
      version: 1,
      activeSheetId: id,
    })
  }, origin)
  return id
}

export function renameSheetInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  name: string,
  origin: unknown = SS_ORIGIN_LOCAL
): void {
  const sm = sheetMap(ydoc, sheetId)
  if (!sm) return
  ydoc.transact(() => {
    sm.set("name", name)
  }, origin)
}

export function deleteSheetInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  origin: unknown = SS_ORIGIN_LOCAL
): boolean {
  const root = rootMap(ydoc)
  const order = root.get("sheetOrder") as Y.Array<string> | undefined
  if (!order || order.length <= 1) return false
  const ids = order.toArray()
  const idx = ids.indexOf(sheetId)
  if (idx < 0) return false
  ydoc.transact(() => {
    order.delete(idx, 1)
    root.delete(`sheet:${sheetId}`)
    const meta = root.get("meta") as { activeSheetId?: string } | undefined
    if (meta?.activeSheetId === sheetId) {
      const nextId = order.get(0) ?? ids.find((id) => id !== sheetId)
      root.set("meta", { version: 1, activeSheetId: nextId })
    }
  }, origin)
  return true
}

export function reorderSheetsInYDoc(
  ydoc: Y.Doc,
  orderedIds: readonly string[],
  origin: unknown = SS_ORIGIN_LOCAL
): void {
  ydoc.transact(() => {
    const root = rootMap(ydoc)
    const order = root.get("sheetOrder") as Y.Array<string> | undefined
    if (!order) return
    order.delete(0, order.length)
    order.push([...orderedIds])
  }, origin)
}

export function setColWidthInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  col: number,
  width: number,
  origin: unknown = SS_ORIGIN_LOCAL
): void {
  const sm = sheetMap(ydoc, sheetId)
  if (!sm) return
  ydoc.transact(() => {
    let cw = sm.get("colWidths") as Y.Map<number> | undefined
    if (!cw) {
      cw = new Y.Map<number>()
      sm.set("colWidths", cw)
    }
    cw.set(String(col), width)
    const cc = Number(sm.get("colCount") ?? 1)
    if (col + 1 > cc) sm.set("colCount", col + 1)
  }, origin)
}

export function setRowHeightInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  row: number,
  height: number,
  origin: unknown = SS_ORIGIN_LOCAL
): void {
  const sm = sheetMap(ydoc, sheetId)
  if (!sm) return
  ydoc.transact(() => {
    let rh = sm.get("rowHeights") as Y.Map<number> | undefined
    if (!rh) {
      rh = new Y.Map<number>()
      sm.set("rowHeights", rh)
    }
    rh.set(String(row), height)
    const rr = Number(sm.get("rowCount") ?? 1)
    if (row + 1 > rr) sm.set("rowCount", row + 1)
  }, origin)
}

export function ensureBoundsInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  minRows: number,
  minCols: number,
  origin: unknown = SS_ORIGIN_SYSTEM
): void {
  const sm = sheetMap(ydoc, sheetId)
  if (!sm) return
  const rr = Number(sm.get("rowCount") ?? 1)
  const cc = Number(sm.get("colCount") ?? 1)
  if (rr >= minRows && cc >= minCols) return
  ydoc.transact(() => {
    if (minRows > rr) sm.set("rowCount", minRows)
    if (minCols > cc) sm.set("colCount", minCols)
  }, origin)
}

export function observeWorkbook(
  ydoc: Y.Doc,
  onChange: (doc: SpreadsheetDocument) => void
): () => void {
  const root = rootMap(ydoc)
  const handler = () => onChange(materializeWorkbook(ydoc))
  root.observeDeep(handler)
  return () => root.unobserveDeep(handler)
}

/** Undo/redo for the spreadsheet root map (local origin only). */
export function createWorkbookUndoManager(
  ydoc: Y.Doc,
  opts?: { captureTimeout?: number }
): Y.UndoManager {
  return new Y.UndoManager([rootMap(ydoc)], {
    // Only user edits — not remote/system transactions
    trackedOrigins: new Set([SS_ORIGIN_LOCAL]),
    captureTimeout: opts?.captureTimeout ?? 300,
  })
}

export { SS_ORIGIN_LOCAL, SS_ORIGIN_REMOTE, SS_ORIGIN_SYSTEM }
