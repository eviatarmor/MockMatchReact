import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { cn } from "@mockmatch/ui/utils"
import { colToLetter, inRange } from "../address"
import { getActiveSheet } from "../document"
import {
  buildColLayout,
  buildRowLayout,
  getColWidth,
  getRowHeight,
  visibleRange,
} from "../layout"
import type {
  CellCoord,
  DisplayCell,
  SpreadsheetDocument,
  SpreadsheetSelection,
} from "../types"
import {
  COL_HEADER_HEIGHT,
  DEFAULT_COL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  MAX_COL_WIDTH,
  MAX_ROW_HEIGHT,
  MIN_COL_WIDTH,
  MIN_ROW_HEIGHT,
  ROW_HEADER_WIDTH,
  SHEET_GROW_BUFFER_COLS,
  SHEET_GROW_BUFFER_ROWS,
  SHEET_MAX_COLS,
  SHEET_MAX_ROWS,
} from "../types"

const OVERSCAN = 4

/** Text highlight inside the cell editor (matches resume / whiteboard blue). */
const CELL_TEXT_SELECTION =
  "caret-blue-500 selection:bg-blue-400/40 selection:text-neutral-900 dark:selection:text-neutral-50"

type ResizeDrag =
  | { kind: "col"; index: number; startX: number; startSize: number }
  | { kind: "row"; index: number; startY: number; startSize: number }

export type SpreadsheetGridProps = {
  readonly document: SpreadsheetDocument
  readonly selection: SpreadsheetSelection
  readonly getDisplay: (row: number, col: number) => DisplayCell
  readonly onSelect: (active: CellCoord, rangeEnd?: CellCoord | null) => void
  readonly onCommitCell: (row: number, col: number, raw: string) => void
  readonly formulaDraft: string
  readonly onFormulaDraftChange: (v: string) => void
  /** Expand sheet so scroll / keyboard can keep going (infinite grid). */
  readonly onEnsureBounds?: (minRows: number, minCols: number) => void
  readonly onSetColWidth?: (col: number, width: number) => void
  readonly onSetRowHeight?: (row: number, height: number) => void
  readonly onSelectColumn?: (col: number) => void
  readonly onSelectRow?: (row: number) => void
  readonly onSelectAll?: () => void
  readonly readOnly?: boolean
  readonly ariaLabel: string
  readonly className?: string
}

export function SpreadsheetGrid({
  document,
  selection,
  getDisplay,
  onSelect,
  onCommitCell,
  formulaDraft,
  onFormulaDraftChange,
  onEnsureBounds,
  onSetColWidth,
  onSetRowHeight,
  onSelectColumn,
  onSelectRow,
  onSelectAll,
  readOnly = false,
  ariaLabel,
  className,
}: SpreadsheetGridProps) {
  const sheet = getActiveSheet(document)
  const rowCount = sheet?.rowCount ?? 0
  const colCount = sheet?.colCount ?? 0

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState({ top: 0, left: 0 })
  const [viewport, setViewport] = useState({ w: 800, h: 600 })
  const [editing, setEditing] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)
  const dragAnchor = useRef<CellCoord | null>(null)
  const resizeDrag = useRef<ResizeDrag | null>(null)
  const [resizeTick, setResizeTick] = useState(0)

  const colLayout = useMemo(
    () =>
      sheet
        ? buildColLayout(sheet)
        : { offsets: [0], total: 0 },
    // resizeTick forces recompute during drag when sheet sizes update
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sheet identity + sizes
    [sheet, sheet?.colCount, sheet?.colWidths, resizeTick]
  )
  const rowLayout = useMemo(
    () =>
      sheet
        ? buildRowLayout(sheet)
        : { offsets: [0], total: 0 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheet, sheet?.rowCount, sheet?.rowHeights, resizeTick]
  )

  const growToCover = useCallback(
    (scrollTop: number, scrollLeft: number, vw: number, vh: number) => {
      if (!onEnsureBounds) return
      // Approximate with defaults (variable sizes still grow past viewport).
      const rowsNeeded =
        Math.ceil((scrollTop + vh) / DEFAULT_ROW_HEIGHT) + SHEET_GROW_BUFFER_ROWS
      const colsNeeded =
        Math.ceil((scrollLeft + vw) / DEFAULT_COL_WIDTH) + SHEET_GROW_BUFFER_COLS
      onEnsureBounds(
        Math.min(SHEET_MAX_ROWS, Math.max(rowsNeeded, 1)),
        Math.min(SHEET_MAX_COLS, Math.max(colsNeeded, 1))
      )
    },
    [onEnsureBounds]
  )

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = el.clientHeight
      setViewport({ w, h })
      growToCover(el.scrollTop, el.scrollLeft, w, h)
    })
    ro.observe(el)
    setViewport({ w: el.clientWidth, h: el.clientHeight })
    growToCover(el.scrollTop, el.scrollLeft, el.clientWidth, el.clientHeight)
    return () => ro.disconnect()
  }, [growToCover])

  useEffect(() => {
    if (editing) {
      editRef.current?.focus()
      editRef.current?.select()
    }
  }, [editing, selection.active.row, selection.active.col])

  useEffect(() => {
    setEditing(false)
  }, [document.activeSheetId])

  // Column / row resize drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = resizeDrag.current
      if (!drag) return
      if (drag.kind === "col" && onSetColWidth) {
        const next = Math.min(
          MAX_COL_WIDTH,
          Math.max(MIN_COL_WIDTH, drag.startSize + (e.clientX - drag.startX))
        )
        onSetColWidth(drag.index, next)
        setResizeTick((t) => t + 1)
      } else if (drag.kind === "row" && onSetRowHeight) {
        const next = Math.min(
          MAX_ROW_HEIGHT,
          Math.max(MIN_ROW_HEIGHT, drag.startSize + (e.clientY - drag.startY))
        )
        onSetRowHeight(drag.index, next)
        setResizeTick((t) => t + 1)
      }
    }
    const onUp = () => {
      if (resizeDrag.current) {
        resizeDrag.current = null
        globalThis.document.body.style.cursor = ""
        globalThis.document.body.style.userSelect = ""
      }
      dragAnchor.current = null
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [onSetColWidth, onSetRowHeight])

  const totalWidth = ROW_HEADER_WIDTH + colLayout.total
  const totalHeight = COL_HEADER_HEIGHT + rowLayout.total

  const { start: colStart, end: colEnd } = visibleRange(
    colLayout,
    scroll.left,
    viewport.w,
    OVERSCAN
  )
  const { start: rowStart, end: rowEnd } = visibleRange(
    rowLayout,
    scroll.top,
    viewport.h,
    OVERSCAN
  )

  const visibleCols = useMemo(() => {
    const cols: number[] = []
    for (let c = colStart; c <= colEnd; c++) cols.push(c)
    return cols
  }, [colStart, colEnd])

  const visibleRows = useMemo(() => {
    const rows: number[] = []
    for (let r = rowStart; r <= rowEnd; r++) rows.push(r)
    return rows
  }, [rowStart, rowEnd])

  const rangeStart = selection.range?.start ?? selection.active
  const rangeEnd = selection.range?.end ?? selection.active

  const commitEdit = useCallback(() => {
    if (!editing || readOnly) {
      setEditing(false)
      return
    }
    onCommitCell(selection.active.row, selection.active.col, formulaDraft)
    setEditing(false)
  }, [
    editing,
    formulaDraft,
    onCommitCell,
    readOnly,
    selection.active.col,
    selection.active.row,
  ])

  const startEdit = useCallback(
    (seed?: string) => {
      if (readOnly) return
      if (seed !== undefined) onFormulaDraftChange(seed)
      setEditing(true)
    },
    [onFormulaDraftChange, readOnly]
  )

  const scrollCellIntoView = useCallback(
    (next: CellCoord) => {
      const el = scrollerRef.current
      if (!el || !sheet) return
      const x = colLayout.offsets[next.col] ?? 0
      const y = rowLayout.offsets[next.row] ?? 0
      const cw = getColWidth(sheet, next.col)
      const rh = getRowHeight(sheet, next.row)
      if (x < el.scrollLeft) el.scrollLeft = x
      if (x + cw > el.scrollLeft + el.clientWidth - ROW_HEADER_WIDTH) {
        el.scrollLeft = x - (el.clientWidth - ROW_HEADER_WIDTH - cw)
      }
      if (y < el.scrollTop) el.scrollTop = y
      if (y + rh > el.scrollTop + el.clientHeight - COL_HEADER_HEIGHT) {
        el.scrollTop = y - (el.clientHeight - COL_HEADER_HEIGHT - rh)
      }
    },
    [colLayout.offsets, rowLayout.offsets, sheet]
  )

  const moveActive = useCallback(
    (dRow: number, dCol: number, extend: boolean) => {
      const next = {
        row: Math.max(
          0,
          Math.min(SHEET_MAX_ROWS - 1, selection.active.row + dRow)
        ),
        col: Math.max(
          0,
          Math.min(SHEET_MAX_COLS - 1, selection.active.col + dCol)
        ),
      }
      onEnsureBounds?.(
        next.row + 1 + SHEET_GROW_BUFFER_ROWS,
        next.col + 1 + SHEET_GROW_BUFFER_COLS
      )
      if (extend) {
        const a = selection.range?.start ?? selection.active
        onSelect(next, a)
      } else {
        onSelect(next, null)
      }
      scrollCellIntoView(next)
    },
    [onEnsureBounds, onSelect, scrollCellIntoView, selection]
  )

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (editing) {
        if (e.key === "Enter") {
          e.preventDefault()
          commitEdit()
          moveActive(e.shiftKey ? -1 : 1, 0, false)
        } else if (e.key === "Tab") {
          e.preventDefault()
          commitEdit()
          moveActive(0, e.shiftKey ? -1 : 1, false)
        } else if (e.key === "Escape") {
          e.preventDefault()
          const d = getDisplay(selection.active.row, selection.active.col)
          onFormulaDraftChange(d.raw)
          setEditing(false)
        }
        return
      }

      if (e.key === "Enter" || e.key === "F2") {
        e.preventDefault()
        startEdit()
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (readOnly) return
        e.preventDefault()
        onCommitCell(selection.active.row, selection.active.col, "")
        onFormulaDraftChange("")
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        moveActive(-1, 0, e.shiftKey)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        moveActive(1, 0, e.shiftKey)
        return
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        moveActive(0, -1, e.shiftKey)
        return
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        moveActive(0, 1, e.shiftKey)
        return
      }
      if (e.key === "Tab") {
        e.preventDefault()
        moveActive(0, e.shiftKey ? -1 : 1, false)
        return
      }
      if (
        !readOnly &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault()
        startEdit(e.key)
      }
    },
    [
      commitEdit,
      editing,
      getDisplay,
      moveActive,
      onCommitCell,
      onFormulaDraftChange,
      readOnly,
      selection.active.col,
      selection.active.row,
      startEdit,
    ]
  )

  const onCellMouseDown = useCallback(
    (row: number, col: number, e: ReactMouseEvent) => {
      if (editing) commitEdit()
      dragAnchor.current = { row, col }
      if (e.shiftKey) {
        onSelect({ row, col }, selection.active)
      } else {
        onSelect({ row, col }, null)
      }
    },
    [commitEdit, editing, onSelect, selection.active]
  )

  const onCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!dragAnchor.current || resizeDrag.current) return
      onSelect({ row, col }, dragAnchor.current)
    },
    [onSelect]
  )

  const startColResize = useCallback(
    (col: number, e: ReactMouseEvent) => {
      if (readOnly || !sheet || !onSetColWidth) return
      e.preventDefault()
      e.stopPropagation()
      resizeDrag.current = {
        kind: "col",
        index: col,
        startX: e.clientX,
        startSize: getColWidth(sheet, col),
      }
      globalThis.document.body.style.cursor = "col-resize"
      globalThis.document.body.style.userSelect = "none"
    },
    [onSetColWidth, readOnly, sheet]
  )

  const startRowResize = useCallback(
    (row: number, e: ReactMouseEvent) => {
      if (readOnly || !sheet || !onSetRowHeight) return
      e.preventDefault()
      e.stopPropagation()
      resizeDrag.current = {
        kind: "row",
        index: row,
        startY: e.clientY,
        startSize: getRowHeight(sheet, row),
      }
      globalThis.document.body.style.cursor = "row-resize"
      globalThis.document.body.style.userSelect = "none"
    },
    [onSetRowHeight, readOnly, sheet]
  )

  return (
    <div
      className={cn("relative min-h-0 min-w-0 flex-1 outline-none", className)}
      tabIndex={0}
      role="grid"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      <div
        ref={scrollerRef}
        className="absolute inset-0 overflow-auto bg-background"
        onScroll={(e) => {
          const t = e.currentTarget
          setScroll({ top: t.scrollTop, left: t.scrollLeft })
          growToCover(t.scrollTop, t.scrollLeft, t.clientWidth, t.clientHeight)
        }}
      >
        <div
          className="relative"
          style={{ width: totalWidth, height: totalHeight }}
        >
          {/* Corner — select all */}
          <div
            role="button"
            tabIndex={-1}
            aria-label="Select all"
            className={cn(
              "sticky left-0 top-0 z-30 cursor-pointer border-b border-r border-border bg-muted/60",
              "hover:bg-muted"
            )}
            style={{
              width: ROW_HEADER_WIDTH,
              height: COL_HEADER_HEIGHT,
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              if (editing) commitEdit()
              onSelectAll?.()
            }}
          />

          {/* Column headers */}
          {visibleCols.map((c) => {
            const inSel = c >= rangeStart.col && c <= rangeEnd.col
            const left = ROW_HEADER_WIDTH + (colLayout.offsets[c] ?? 0)
            const width = sheet ? getColWidth(sheet, c) : DEFAULT_COL_WIDTH
            return (
              <div
                key={`ch-${c}`}
                role="columnheader"
                className={cn(
                  "group sticky top-0 z-20 flex cursor-pointer items-center justify-center border-b border-r border-border text-2xs font-medium select-none",
                  inSel
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                )}
                style={{
                  position: "absolute",
                  left,
                  top: 0,
                  width,
                  height: COL_HEADER_HEIGHT,
                }}
                onMouseDown={(e) => {
                  // Resize handle owns the right edge
                  if ((e.target as HTMLElement).dataset.resize === "col") return
                  e.preventDefault()
                  if (editing) commitEdit()
                  onSelectColumn?.(c)
                }}
              >
                <span>{colToLetter(c)}</span>
                {!readOnly ? (
                  <div
                    data-resize="col"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize column ${colToLetter(c)}`}
                    className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                    onMouseDown={(e) => startColResize(c, e)}
                  />
                ) : null}
              </div>
            )
          })}

          {/* Row headers + cells */}
          {visibleRows.map((r) => {
            const rowInSel = r >= rangeStart.row && r <= rangeEnd.row
            const top = COL_HEADER_HEIGHT + (rowLayout.offsets[r] ?? 0)
            const height = sheet ? getRowHeight(sheet, r) : DEFAULT_ROW_HEIGHT
            return (
              <div key={`r-${r}`}>
                <div
                  role="rowheader"
                  className={cn(
                    "group sticky left-0 z-20 flex cursor-pointer items-center justify-center border-b border-r border-border text-2xs tabular-nums select-none",
                    rowInSel
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                  )}
                  style={{
                    position: "absolute",
                    left: 0,
                    top,
                    width: ROW_HEADER_WIDTH,
                    height,
                  }}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).dataset.resize === "row") return
                    e.preventDefault()
                    if (editing) commitEdit()
                    onSelectRow?.(r)
                  }}
                >
                  {r + 1}
                  {!readOnly ? (
                    <div
                      data-resize="row"
                      role="separator"
                      aria-orientation="horizontal"
                      aria-label={`Resize row ${r + 1}`}
                      className="absolute right-0 bottom-0 left-0 z-10 h-1.5 cursor-row-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => startRowResize(r, e)}
                    />
                  ) : null}
                </div>
                {visibleCols.map((c) => {
                  const active =
                    selection.active.row === r && selection.active.col === c
                  const ranged =
                    selection.range &&
                    inRange(
                      { row: r, col: c },
                      selection.range.start,
                      selection.range.end
                    )
                  const display = getDisplay(r, c)
                  const isEdit =
                    editing &&
                    selection.active.row === r &&
                    selection.active.col === c
                  const left = ROW_HEADER_WIDTH + (colLayout.offsets[c] ?? 0)
                  const width = sheet ? getColWidth(sheet, c) : DEFAULT_COL_WIDTH

                  return (
                    <div
                      key={`c-${r}-${c}`}
                      role="gridcell"
                      aria-selected={active || Boolean(ranged)}
                      className={cn(
                        "absolute flex items-center border-b border-r border-border/80 px-1.5 text-xs",
                        ranged && !active && "bg-blue-400/15 dark:bg-blue-400/20",
                        active &&
                          "z-10 bg-background ring-2 ring-inset ring-blue-400",
                        display.error && "text-destructive",
                        !display.error &&
                          display.isFormula &&
                          "text-foreground",
                        !display.error &&
                          !display.isFormula &&
                          typeof display.display === "string" &&
                          /^-?\d/.test(display.display) &&
                          "justify-end tabular-nums"
                      )}
                      style={{
                        left,
                        top,
                        width,
                        height,
                      }}
                      onMouseDown={(e) => onCellMouseDown(r, c, e)}
                      onMouseEnter={() => onCellMouseEnter(r, c)}
                      onDoubleClick={() => startEdit()}
                    >
                      {isEdit ? (
                        <input
                          ref={editRef}
                          className={cn(
                            "h-full w-full bg-transparent px-0.5 text-xs outline-none",
                            CELL_TEXT_SELECTION
                          )}
                          value={formulaDraft}
                          onChange={(e) => onFormulaDraftChange(e.target.value)}
                          onBlur={commitEdit}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{display.display}</span>
                      )}
                      {active && !isEdit ? (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute -bottom-0.5 -right-0.5 size-1.5 bg-blue-400 ring-1 ring-background"
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
