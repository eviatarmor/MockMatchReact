import type { SpreadsheetPlugin } from "../../plugin-system"

/**
 * Ctrl/Cmd+Z undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z redo.
 * When editing a cell, browser handles text undo inside the input.
 */
export function createHistoryPlugin(): SpreadsheetPlugin {
  return {
    id: "history",
    order: 5,
    onKeyDown(e, ctx) {
      if (ctx.isEditing()) return false
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return false

      const key = e.key.toLowerCase()
      if (key === "z" && !e.shiftKey) {
        e.preventDefault()
        ctx.dispatch({ type: "undo" })
        return true
      }
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault()
        ctx.dispatch({ type: "redo" })
        return true
      }
      return false
    },
  }
}
