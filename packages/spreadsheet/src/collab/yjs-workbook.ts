import * as Y from "yjs"
import { cellKey } from "../address"
import { createEmptyWorkbook } from "../document"
import type { SpreadsheetCell, SpreadsheetDocument, SpreadsheetSheet } from "../types"

function rootMap(ydoc: Y.Doc): Y.Map<unknown> {
  return ydoc.getMap("spreadsheet")
}

/**
 * Materialize a durable workbook from a Y.Doc.
 *
 * ```
 * ydoc.getMap("spreadsheet")
 *   meta: { activeSheetId, version }
 *   sheetOrder: Y.Array<string>
 *   sheet:<id>: Y.Map { name, rowCount, colCount, cells: Y.Map<string> }
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
    const cellsMap = sm.get("cells") as Y.Map<string> | undefined
    const cells: Record<string, SpreadsheetCell> = {}
    cellsMap?.forEach((raw, key) => {
      if (typeof raw === "string" && raw !== "") cells[key] = { raw }
    })
    sheets.push({
      id,
      name: String(sm.get("name") ?? "Sheet"),
      rowCount: Number(sm.get("rowCount") ?? 100),
      colCount: Number(sm.get("colCount") ?? 26),
      cells,
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
  seed?: SpreadsheetDocument
): void {
  const root = rootMap(ydoc)
  const order = root.get("sheetOrder") as Y.Array<string> | undefined
  if (order && order.length > 0) return

  const doc = seed ?? createEmptyWorkbook()
  ydoc.transact(() => {
    const sheetOrder = new Y.Array<string>()
    root.set("sheetOrder", sheetOrder)
    root.set("meta", {
      version: 1,
      activeSheetId: doc.activeSheetId,
    })
    for (const sheet of doc.sheets) {
      sheetOrder.push([sheet.id])
      const sm = new Y.Map<unknown>()
      sm.set("name", sheet.name)
      sm.set("rowCount", sheet.rowCount)
      sm.set("colCount", sheet.colCount)
      const cells = new Y.Map<string>()
      for (const [k, v] of Object.entries(sheet.cells)) {
        cells.set(k, v.raw)
      }
      sm.set("cells", cells)
      root.set(`sheet:${sheet.id}`, sm)
    }
  })
}

export function setCellInYDoc(
  ydoc: Y.Doc,
  sheetId: string,
  row: number,
  col: number,
  raw: string
): void {
  const root = rootMap(ydoc)
  const sm = root.get(`sheet:${sheetId}`) as Y.Map<unknown> | undefined
  if (!sm) return
  let cells = sm.get("cells") as Y.Map<string> | undefined
  if (!cells) {
    cells = new Y.Map<string>()
    sm.set("cells", cells)
  }
  const key = cellKey(row, col)
  ydoc.transact(() => {
    if (raw === "") cells!.delete(key)
    else cells!.set(key, raw)
  })
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
