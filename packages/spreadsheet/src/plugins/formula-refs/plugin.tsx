import {
  applyFormulaRefPick,
  isFormulaPickDraft,
  type FormulaRefPickSession,
} from "../../formula/ref-spans"
import type {
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
  SpreadsheetPointerDownEvent,
} from "../../plugin-system"

function isPickMode(ctx: SpreadsheetPluginContext): boolean {
  if (!ctx.canEdit()) return false
  if (!isFormulaPickDraft(ctx.getFormulaDraft())) return false
  return ctx.isEditing() || Boolean(ctx.isFormulaBarActive?.())
}

/**
 * Excel-like formula refs:
 * - Color-match grid cells/ranges to formula tokens while editing
 * - Click / drag on grid inserts A1 (or A1:B2) into the formula
 */
export function createFormulaRefsPlugin(): SpreadsheetPlugin {
  let pick: FormulaRefPickSession | null = null

  return {
    id: "formula-refs",
    /** Before selection so pick mode steals cell clicks. */
    order: 5,
    onPointerDown(e: SpreadsheetPointerDownEvent, ctx) {
      if (!isPickMode(ctx)) {
        pick = null
        return false
      }
      if (e.target !== "cell" || e.row === undefined || e.col === undefined) {
        return false
      }

      // Keep formula input focused (no blur-commit).
      e.preventDefault()
      e.stopPropagation()

      const anchor = { row: e.row, col: e.col }
      const caret = ctx.getFormulaCaret?.() ?? ctx.getFormulaDraft().length
      const result = applyFormulaRefPick(
        ctx.getFormulaDraft(),
        caret,
        anchor,
        anchor,
        null
      )
      pick = result.session
      ctx.setFormulaDraft(result.next)
      ctx.setFormulaCaret?.(result.caret)
      return true
    },
    onPointerMove(e, ctx) {
      if (!pick) return false
      if (!isPickMode(ctx)) {
        pick = null
        return false
      }
      if (e.row === undefined || e.col === undefined) return false

      const focus = { row: e.row, col: e.col }
      const caret = ctx.getFormulaCaret?.() ?? pick.end
      const result = applyFormulaRefPick(
        ctx.getFormulaDraft(),
        caret,
        pick.anchor,
        focus,
        pick
      )
      pick = result.session
      ctx.setFormulaDraft(result.next)
      ctx.setFormulaCaret?.(result.caret)
      return true
    },
    onPointerUp() {
      if (!pick) return false
      // Keep session until next pick starts with null session — actually
      // clear so next click can replace trailing ref via findRefInsertSite
      // or insert after. Excel replaces the just-picked ref if you click again
      // without typing; findRefInsertSite at caret (end of ref) does that.
      pick = null
      return true
    },
    // Cell chrome is painted by SpreadsheetGrid from formulaDraft (reliable
    // React data path). Plugin keeps click/drag insert only.
  }
}
