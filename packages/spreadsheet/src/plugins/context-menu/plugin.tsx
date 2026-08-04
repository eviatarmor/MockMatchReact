import { useEffect, useState } from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@mockmatch/ui/context-menu"
import type { SpreadsheetShellLabels } from "../../types"
import type {
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
} from "../../plugin-system"
import { selectionBounds } from "../selection-utils"

function L(
  ctx: SpreadsheetPluginContext,
  key: keyof SpreadsheetShellLabels,
  fallback: string
): string {
  const v = ctx.getLabels()[key]
  return typeof v === "string" && v.length > 0 ? v : fallback
}

function clearContents(ctx: SpreadsheetPluginContext) {
  if (!ctx.canEdit()) return
  const b = selectionBounds(ctx)
  const cells: { row: number; col: number; raw: string }[] = []
  for (let r = b.startRow; r <= b.endRow; r++) {
    for (let c = b.startCol; c <= b.endCol; c++) {
      cells.push({ row: r, col: c, raw: "" })
    }
  }
  ctx.dispatch({ type: "setCells", cells })
  ctx.setFormulaDraft("")
}

/** Right-click cell menu: clear, insert/delete row/col, paste. */
export function createContextMenuPlugin(): SpreadsheetPlugin {
  let setPos: ((v: { x: number; y: number } | null) => void) | null = null

  return {
    id: "context-menu",
    order: 80,
    onContextMenu(e, ctx) {
      if (e.target !== "cell") return false
      e.preventDefault()
      if (e.row !== undefined && e.col !== undefined) {
        const b = selectionBounds(ctx)
        const inside =
          e.row >= b.startRow &&
          e.row <= b.endRow &&
          e.col >= b.startCol &&
          e.col <= b.endCol
        if (!inside) {
          ctx.setSelection({ row: e.row, col: e.col }, null)
        }
      }
      setPos?.({ x: e.clientX, y: e.clientY })
      return true
    },
    renderChrome(ctx, slot) {
      if (slot !== "overlay") return null
      return (
        <ContextMenuHost
          key="cell-context-menu"
          ctx={ctx}
          bind={(fn) => {
            setPos = fn
          }}
        />
      )
    },
  }
}

function ContextMenuHost({
  ctx,
  bind,
}: {
  ctx: SpreadsheetPluginContext
  bind: (fn: (v: { x: number; y: number } | null) => void) => void
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    bind(setPos)
    return () => bind(() => {})
  }, [bind])

  if (!pos) return null

  const b = selectionBounds(ctx)
  const rowCount = b.endRow - b.startRow + 1
  const colCount = b.endCol - b.startCol + 1
  const ro = !ctx.canEdit()

  return (
    <div
      className="pointer-events-auto fixed z-50"
      style={{ left: pos.x, top: pos.y }}
    >
      <ContextMenu
        open
        onOpenChange={(open) => {
          if (!open) setPos(null)
        }}
      >
        <ContextMenuTrigger className="block size-px opacity-0">
          .
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-44">
          <ContextMenuItem
            disabled={ro}
            onSelect={() => {
              void (async () => {
                try {
                  const text = await navigator.clipboard.readText()
                  if (!text) return
                  const rows = text.replace(/\r\n/g, "\n").split("\n")
                  const active = ctx.getSelection().active
                  const cells: { row: number; col: number; raw: string }[] =
                    []
                  for (let ri = 0; ri < rows.length; ri++) {
                    const cols = rows[ri]!.split("\t")
                    for (let ci = 0; ci < cols.length; ci++) {
                      cells.push({
                        row: active.row + ri,
                        col: active.col + ci,
                        raw: cols[ci] ?? "",
                      })
                    }
                  }
                  if (cells.length) ctx.dispatch({ type: "setCells", cells })
                } catch {
                  /* denied */
                }
              })()
            }}
          >
            {L(ctx, "paste", "Paste")}
          </ContextMenuItem>
          <ContextMenuItem disabled={ro} onSelect={() => clearContents(ctx)}>
            {L(ctx, "clearContents", "Clear contents")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            disabled={ro}
            onSelect={() =>
              ctx.dispatch({
                type: "insertRows",
                at: b.startRow,
                count: rowCount,
              })
            }
          >
            {L(ctx, "insertRow", "Insert row")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={ro}
            onSelect={() =>
              ctx.dispatch({
                type: "deleteRows",
                at: b.startRow,
                count: rowCount,
              })
            }
          >
            {L(ctx, "deleteRow", "Delete row")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={ro}
            onSelect={() =>
              ctx.dispatch({
                type: "insertCols",
                at: b.startCol,
                count: colCount,
              })
            }
          >
            {L(ctx, "insertCol", "Insert column")}
          </ContextMenuItem>
          <ContextMenuItem
            disabled={ro}
            onSelect={() =>
              ctx.dispatch({
                type: "deleteCols",
                at: b.startCol,
                count: colCount,
              })
            }
          >
            {L(ctx, "deleteCol", "Delete column")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}
