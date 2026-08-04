import { keyboardMoveActive } from "../keyboard/plugin"
import type {
  CellRect,
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
} from "../../plugin-system"

/** Text highlight inside the cell editor (matches resume / whiteboard blue). */
const CELL_TEXT_SELECTION =
  "caret-blue-500 selection:bg-blue-400/40 selection:text-neutral-900 dark:selection:text-neutral-50"

function startEdit(ctx: SpreadsheetPluginContext, seed?: string) {
  if (!ctx.canEdit()) return
  if (seed !== undefined) ctx.setFormulaDraft(seed)
  ctx.setEditing(true)
}

function commitEdit(ctx: SpreadsheetPluginContext) {
  if (!ctx.isEditing() || !ctx.canEdit()) {
    ctx.setEditing(false)
    return
  }
  ctx.commitActiveCell?.()
  ctx.setEditing(false)
}

/** F2 / type-to-edit / Enter-edit; plain input editor. */
export function createCellEditPlugin(): SpreadsheetPlugin {
  return {
    id: "cell-edit",
    order: 30,
    onKeyDown(e, ctx) {
      if (ctx.isEditing()) {
        if (e.key === "Enter") {
          e.preventDefault()
          commitEdit(ctx)
          keyboardMoveActive(ctx, e.shiftKey ? -1 : 1, 0, false)
          return true
        }
        if (e.key === "Tab") {
          e.preventDefault()
          commitEdit(ctx)
          keyboardMoveActive(ctx, 0, e.shiftKey ? -1 : 1, false)
          return true
        }
        if (e.key === "Escape") {
          e.preventDefault()
          const { row, col } = ctx.getSelection().active
          const d = ctx.getDisplay(row, col)
          ctx.setFormulaDraft(d.raw)
          ctx.setEditing(false)
          return true
        }
        // Let the input handle other keys while editing.
        return true
      }

      if (e.key === "Enter" || e.key === "F2") {
        e.preventDefault()
        startEdit(ctx)
        return true
      }

      if (
        ctx.canEdit() &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault()
        startEdit(ctx, e.key)
        return true
      }

      return false
    },
    // Double-click → setEditing is handled by the grid host; selection ends edit on click.
    renderCellEditor(ctx, _cellRect: CellRect) {
      if (!ctx.isEditing()) return null
      const draft = ctx.getFormulaDraft()
      return (
        <input
          data-spreadsheet-cell-editor
          className={`h-full w-full bg-transparent px-0.5 text-xs outline-none ${CELL_TEXT_SELECTION}`}
          value={draft}
          onChange={(ev) => ctx.setFormulaDraft(ev.target.value)}
          onBlur={() => commitEdit(ctx)}
          onMouseDown={(ev) => ev.stopPropagation()}
          autoFocus
        />
      )
    },
  }
}

export { startEdit as cellEditStart, commitEdit as cellEditCommit }
