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
import {
  parseFormulaRefSpans,
  refColorForCell,
} from "../formula/ref-spans"
import {
  runPluginContextMenu,
  runPluginKeyDown,
  runPluginPointerDown,
  runPluginPointerMove,
  runPluginPointerUp,
  type SpreadsheetPlugin,
  type SpreadsheetPluginContext,
} from "../plugin-system"
import { fillDownFromHandle } from "../plugins/fill/plugin"
import type {
  DisplayCell,
  SpreadsheetDocument,
  SpreadsheetSelection,
} from "../types"
import {
  COL_HEADER_HEIGHT,
  DEFAULT_COL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  ROW_HEADER_WIDTH,
  SHEET_GROW_BUFFER_COLS,
  SHEET_GROW_BUFFER_ROWS,
  SHEET_MAX_COLS,
  SHEET_MAX_ROWS,
} from "../types"

const OVERSCAN = 4

export type SpreadsheetGridProps = {
  readonly document: SpreadsheetDocument
  readonly selection: SpreadsheetSelection
  readonly getDisplay: (row: number, col: number) => DisplayCell
  readonly formulaDraft: string
  readonly plugins: readonly SpreadsheetPlugin[]
  readonly ctx: SpreadsheetPluginContext
  readonly editing: boolean
  /** Formula bar focused — same ref-highlight mode as in-cell edit. */
  readonly formulaBarActive?: boolean
  readonly ariaLabel: string
  readonly className?: string
  readonly bindScrollCellIntoView?: (
    fn: (coord: { row: number; col: number }) => void
  ) => void
  readonly bindGetActiveCellRect?: (
    fn: () => {
      left: number
      top: number
      width: number
      height: number
    } | null
  ) => void
}

/**
 * Thin virtualized grid host. Interaction comes from `plugins` via `ctx`.
 */
export function SpreadsheetGrid({
  document,
  selection,
  getDisplay,
  formulaDraft,
  plugins,
  ctx,
  editing,
  formulaBarActive = false,
  ariaLabel,
  className,
  bindScrollCellIntoView,
  bindGetActiveCellRect,
}: SpreadsheetGridProps) {
  const sheet = getActiveSheet(document)
  const rowCount = sheet?.rowCount ?? 0
  const colCount = sheet?.colCount ?? 0

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState({ top: 0, left: 0 })
  const [viewport, setViewport] = useState({ w: 800, h: 600 })
  const [layoutTick, setLayoutTick] = useState(0)

  const colLayout = useMemo(
    () =>
      sheet
        ? buildColLayout(sheet)
        : { offsets: [0], total: 0 },
    // layoutTick forces recompute during resize drag
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sheet identity + sizes
    [sheet, sheet?.colCount, sheet?.colWidths, layoutTick]
  )
  const rowLayout = useMemo(
    () =>
      sheet
        ? buildRowLayout(sheet)
        : { offsets: [0], total: 0 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheet, sheet?.rowCount, sheet?.rowHeights, layoutTick]
  )

  const growToCover = useCallback(
    (scrollTop: number, scrollLeft: number, vw: number, vh: number) => {
      const rowsNeeded =
        Math.ceil((scrollTop + vh) / DEFAULT_ROW_HEIGHT) + SHEET_GROW_BUFFER_ROWS
      const colsNeeded =
        Math.ceil((scrollLeft + vw) / DEFAULT_COL_WIDTH) + SHEET_GROW_BUFFER_COLS
      ctx.dispatch({
        type: "ensureBounds",
        minRows: Math.min(SHEET_MAX_ROWS, Math.max(rowsNeeded, 1)),
        minCols: Math.min(SHEET_MAX_COLS, Math.max(colsNeeded, 1)),
      })
    },
    [ctx]
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

  // Focus editor when entering edit mode
  useEffect(() => {
    if (!editing) return
    const input = scrollerRef.current?.querySelector<HTMLInputElement>(
      "[data-spreadsheet-cell-editor]"
    )
    input?.focus()
    input?.select()
  }, [editing, selection.active.row, selection.active.col])

  const scrollCellIntoView = useCallback(
    (next: { row: number; col: number }) => {
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

  const getActiveCellRect = useCallback(() => {
    if (!sheet) return null
    const { row, col } = selection.active
    return {
      left: ROW_HEADER_WIDTH + (colLayout.offsets[col] ?? 0),
      top: COL_HEADER_HEIGHT + (rowLayout.offsets[row] ?? 0),
      width: getColWidth(sheet, col),
      height: getRowHeight(sheet, row),
    }
  }, [colLayout.offsets, rowLayout.offsets, selection.active, sheet])

  useEffect(() => {
    bindScrollCellIntoView?.(scrollCellIntoView)
  }, [bindScrollCellIntoView, scrollCellIntoView])

  useEffect(() => {
    bindGetActiveCellRect?.(getActiveCellRect)
  }, [bindGetActiveCellRect, getActiveCellRect])

  // Window-level move/up for drag (selection + resize)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const handled = runPluginPointerMove(
        plugins,
        { clientX: e.clientX, clientY: e.clientY },
        ctx
      )
      // Resize updates col/row sizes — recompute layouts
      if (handled) setLayoutTick((t) => t + 1)
    }
    const onUp = (e: MouseEvent) => {
      runPluginPointerUp(
        plugins,
        { clientX: e.clientX, clientY: e.clientY },
        ctx
      )
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [ctx, plugins])

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

  const gridFocusRef = useRef<HTMLDivElement>(null)

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      runPluginKeyDown(plugins, e.nativeEvent, ctx)
    },
    [ctx, plugins]
  )

  const firePointerDown = useCallback(
    (
      target: Parameters<typeof runPluginPointerDown>[1]["target"],
      e: ReactMouseEvent,
      row?: number,
      col?: number
    ) => {
      runPluginPointerDown(
        plugins,
        {
          clientX: e.clientX,
          clientY: e.clientY,
          shiftKey: e.shiftKey,
          target,
          row,
          col,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation(),
        },
        ctx
      )
      // Keep keyboard shortcuts on the grid host — but not when a plugin
      // preventDefault'd (formula ref-pick keeps focus in formula input).
      if (
        target !== "col-resize" &&
        target !== "row-resize" &&
        !e.defaultPrevented
      ) {
        gridFocusRef.current?.focus({ preventScroll: true })
      }
    },
    [ctx, plugins]
  )

  const fireContextMenu = useCallback(
    (
      target: Parameters<typeof runPluginPointerDown>[1]["target"],
      e: React.MouseEvent,
      row?: number,
      col?: number
    ) => {
      runPluginContextMenu(
        plugins,
        {
          clientX: e.clientX,
          clientY: e.clientY,
          target,
          row,
          col,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation(),
        },
        ctx
      )
    },
    [ctx, plugins]
  )

  const cellEditor = useMemo(() => {
    if (!editing) return null
    for (const p of plugins) {
      const rect = getActiveCellRect()
      if (!rect) continue
      const node = p.renderCellEditor?.(ctx, rect)
      if (node != null) return node
    }
    return null
  }, [ctx, editing, getActiveCellRect, plugins])

  // Formula ref highlights while editing / formula bar (e.g. =E2 → paint E2).
  const formulaRefSpans = useMemo(() => {
    if (!formulaDraft.startsWith("=")) return []
    if (!editing && !formulaBarActive) return []
    return parseFormulaRefSpans(formulaDraft)
  }, [editing, formulaBarActive, formulaDraft])

  void rowCount
  void colCount

  return (
    <div
      ref={gridFocusRef}
      className={cn(
        "relative h-0 min-h-0 min-w-0 w-full flex-1 outline-none",
        className
      )}
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
            onMouseDown={(e) => firePointerDown("corner", e)}
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
                  if ((e.target as HTMLElement).dataset.resize === "col") return
                  firePointerDown("col-header", e, undefined, c)
                }}
              >
                <span>{colToLetter(c)}</span>
                {ctx.canEdit() ? (
                  <div
                    data-resize="col"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize column ${colToLetter(c)}`}
                    className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                    onMouseDown={(e) => firePointerDown("col-resize", e, undefined, c)}
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
                    firePointerDown("row-header", e, r, undefined)
                  }}
                >
                  {r + 1}
                  {ctx.canEdit() ? (
                    <div
                      data-resize="row"
                      role="separator"
                      aria-orientation="horizontal"
                      aria-label={`Resize row ${r + 1}`}
                      className="absolute right-0 bottom-0 left-0 z-10 h-1.5 cursor-row-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => firePointerDown("row-resize", e, r, undefined)}
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
                  const refColor =
                    formulaRefSpans.length > 0
                      ? refColorForCell(formulaRefSpans, r, c)
                      : null
                  const cellStyle = display.style
                  const align =
                    cellStyle?.align ??
                    (!display.error &&
                    !display.isFormula &&
                    typeof display.display === "string" &&
                    /^-?\d/.test(display.display)
                      ? "right"
                      : "left")

                  return (
                    <div
                      key={`c-${r}-${c}`}
                      role="gridcell"
                      aria-selected={active || Boolean(ranged)}
                      data-formula-ref={refColor ? "true" : undefined}
                      className={cn(
                        "absolute flex cursor-default select-none items-center border-b border-r border-border/80 px-1.5 text-xs",
                        ranged && !active && !refColor && "bg-blue-400/15 dark:bg-blue-400/20",
                        active &&
                          !refColor &&
                          "z-10 bg-background ring-2 ring-inset ring-blue-400",
                        active && refColor && "z-10 bg-background",
                        display.error && "text-destructive",
                        !display.error &&
                          display.isFormula &&
                          "text-foreground",
                        align === "center" && "justify-center",
                        align === "right" && "justify-end tabular-nums",
                        align === "left" && "justify-start",
                        cellStyle?.bold && "font-semibold",
                        cellStyle?.italic && "italic",
                        cellStyle?.underline && "underline",
                        cellStyle?.wrap
                          ? "whitespace-pre-wrap break-words"
                          : "truncate"
                      )}
                      style={{
                        left,
                        top,
                        width,
                        height,
                        color: cellStyle?.color,
                        backgroundColor: refColor
                          ? `color-mix(in srgb, ${refColor} 22%, transparent)`
                          : cellStyle?.fill,
                        ...(refColor
                          ? {
                              boxShadow: `inset 0 0 0 2px ${refColor}`,
                              zIndex: active ? 10 : 5,
                            }
                          : null),
                      }}
                      onMouseDown={(e) => firePointerDown("cell", e, r, c)}
                      onContextMenu={(e) => fireContextMenu("cell", e, r, c)}
                      onMouseEnter={() => {
                        runPluginPointerMove(
                          plugins,
                          {
                            clientX: 0,
                            clientY: 0,
                            row: r,
                            col: c,
                          },
                          ctx
                        )
                      }}
                      onDoubleClick={() => {
                        if (ctx.canEdit()) ctx.setEditing(true)
                      }}
                    >
                      {isEdit ? (
                        cellEditor
                      ) : (
                        <span
                          className={cn(
                            cellStyle?.wrap ? "whitespace-pre-wrap" : "truncate"
                          )}
                        >
                          {display.display}
                        </span>
                      )}
                      {plugins.map((p) =>
                        p.renderCellOverlay?.(ctx, {
                          row: r,
                          col: c,
                          rect: { left, top, width, height },
                        })
                      )}
                      {active && !isEdit && ctx.canEdit() ? (
                        <div
                          role="button"
                          tabIndex={-1}
                          aria-label="Fill handle"
                          data-fill-handle
                          className="absolute -bottom-1 -right-1 z-20 size-2.5 cursor-crosshair bg-blue-500 ring-1 ring-background hover:bg-blue-600"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            firePointerDown("fill-handle", e, r, c)
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            fillDownFromHandle(ctx)
                          }}
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
