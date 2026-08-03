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
  ROW_HEADER_WIDTH,
} from "../types"

const OVERSCAN = 4

export type SpreadsheetGridProps = {
  readonly document: SpreadsheetDocument
  readonly selection: SpreadsheetSelection
  readonly getDisplay: (row: number, col: number) => DisplayCell
  readonly onSelect: (active: CellCoord, rangeEnd?: CellCoord | null) => void
  readonly onCommitCell: (row: number, col: number, raw: string) => void
  readonly formulaDraft: string
  readonly onFormulaDraftChange: (v: string) => void
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

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setViewport({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    setViewport({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (editing) {
      editRef.current?.focus()
      editRef.current?.select()
    }
  }, [editing, selection.active.row, selection.active.col])

  // Exit edit mode when sheet switches
  useEffect(() => {
    setEditing(false)
  }, [document.activeSheetId])

  const totalWidth = ROW_HEADER_WIDTH + colCount * DEFAULT_COL_WIDTH
  const totalHeight = COL_HEADER_HEIGHT + rowCount * DEFAULT_ROW_HEIGHT

  const colStart = Math.max(
    0,
    Math.floor(scroll.left / DEFAULT_COL_WIDTH) - OVERSCAN
  )
  const colEnd = Math.min(
    colCount - 1,
    Math.ceil((scroll.left + viewport.w) / DEFAULT_COL_WIDTH) + OVERSCAN
  )
  const rowStart = Math.max(
    0,
    Math.floor(scroll.top / DEFAULT_ROW_HEIGHT) - OVERSCAN
  )
  const rowEnd = Math.min(
    rowCount - 1,
    Math.ceil((scroll.top + viewport.h) / DEFAULT_ROW_HEIGHT) + OVERSCAN
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

  const moveActive = useCallback(
    (dRow: number, dCol: number, extend: boolean) => {
      const next = {
        row: Math.max(0, Math.min(rowCount - 1, selection.active.row + dRow)),
        col: Math.max(0, Math.min(colCount - 1, selection.active.col + dCol)),
      }
      if (extend) {
        const a = selection.range?.start ?? selection.active
        onSelect(next, a)
      } else {
        onSelect(next, null)
      }
      // Scroll into view
      const el = scrollerRef.current
      if (!el) return
      const x = next.col * DEFAULT_COL_WIDTH
      const y = next.row * DEFAULT_ROW_HEIGHT
      if (x < el.scrollLeft) el.scrollLeft = x
      if (x + DEFAULT_COL_WIDTH > el.scrollLeft + el.clientWidth - ROW_HEADER_WIDTH) {
        el.scrollLeft = x - (el.clientWidth - ROW_HEADER_WIDTH - DEFAULT_COL_WIDTH)
      }
      if (y < el.scrollTop) el.scrollTop = y
      if (y + DEFAULT_ROW_HEIGHT > el.scrollTop + el.clientHeight - COL_HEADER_HEIGHT) {
        el.scrollTop = y - (el.clientHeight - COL_HEADER_HEIGHT - DEFAULT_ROW_HEIGHT)
      }
    },
    [colCount, onSelect, rowCount, selection]
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
      // Type-to-edit for printable chars
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
      if (!dragAnchor.current) return
      onSelect({ row, col }, dragAnchor.current)
    },
    [onSelect]
  )

  useEffect(() => {
    const up = () => {
      dragAnchor.current = null
    }
    window.addEventListener("mouseup", up)
    return () => window.removeEventListener("mouseup", up)
  }, [])

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
        }}
      >
        <div
          className="relative"
          style={{ width: totalWidth, height: totalHeight }}
        >
          {/* Corner */}
          <div
            className="sticky left-0 top-0 z-30 border-b border-r border-border bg-muted/60"
            style={{
              width: ROW_HEADER_WIDTH,
              height: COL_HEADER_HEIGHT,
            }}
          />

          {/* Column headers */}
          {visibleCols.map((c) => (
            <div
              key={`ch-${c}`}
              className="sticky top-0 z-20 flex items-center justify-center border-b border-r border-border bg-muted/40 text-2xs font-medium text-muted-foreground"
              style={{
                position: "absolute",
                left: ROW_HEADER_WIDTH + c * DEFAULT_COL_WIDTH,
                top: 0,
                width: DEFAULT_COL_WIDTH,
                height: COL_HEADER_HEIGHT,
              }}
            >
              <span className="sticky top-0">{colToLetter(c)}</span>
            </div>
          ))}

          {/* Row headers + cells */}
          {visibleRows.map((r) => (
            <div key={`r-${r}`}>
              <div
                className="sticky left-0 z-20 flex items-center justify-center border-b border-r border-border bg-muted/40 text-2xs tabular-nums text-muted-foreground"
                style={{
                  position: "absolute",
                  left: 0,
                  top: COL_HEADER_HEIGHT + r * DEFAULT_ROW_HEIGHT,
                  width: ROW_HEADER_WIDTH,
                  height: DEFAULT_ROW_HEIGHT,
                }}
              >
                {r + 1}
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

                return (
                  <div
                    key={`c-${r}-${c}`}
                    role="gridcell"
                    aria-selected={active || Boolean(ranged)}
                    className={cn(
                      "absolute flex items-center border-b border-r border-border/80 px-1.5 text-xs",
                      active && "ring-2 ring-inset ring-primary z-10",
                      ranged && !active && "bg-primary/10",
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
                      left: ROW_HEADER_WIDTH + c * DEFAULT_COL_WIDTH,
                      top: COL_HEADER_HEIGHT + r * DEFAULT_ROW_HEIGHT,
                      width: DEFAULT_COL_WIDTH,
                      height: DEFAULT_ROW_HEIGHT,
                    }}
                    onMouseDown={(e) => onCellMouseDown(r, c, e)}
                    onMouseEnter={() => onCellMouseEnter(r, c)}
                    onDoubleClick={() => startEdit()}
                  >
                    {isEdit ? (
                      <input
                        ref={editRef}
                        className="h-full w-full bg-background px-0.5 text-xs outline-none"
                        value={formulaDraft}
                        onChange={(e) => onFormulaDraftChange(e.target.value)}
                        onBlur={commitEdit}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{display.display}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
