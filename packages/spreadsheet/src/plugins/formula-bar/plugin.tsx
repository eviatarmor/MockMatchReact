import { toA1 } from "../../address"
import { FormulaBar } from "../../formula-bar"
import type { SpreadsheetPlugin } from "../../plugin-system"

/** Top chrome: name box + formula field. */
export function createFormulaBarPlugin(): SpreadsheetPlugin {
  return {
    id: "formula-bar",
    order: 50,
    renderChrome(ctx, slot) {
      if (slot !== "top") return null
      const selection = ctx.getSelection()
      const labels = ctx.getLabels()
      const a1 = toA1(selection.active.row, selection.active.col)
      return (
        <FormulaBar
          key="formula-bar"
          a1={a1}
          value={ctx.getFormulaDraft()}
          onChange={(v) => {
            // Typing in the bar counts as formula entry even if focus race.
            ctx.setFormulaBarActive?.(true)
            ctx.setFormulaDraft(v)
          }}
          caret={ctx.getFormulaCaret?.()}
          onCaretChange={ctx.setFormulaCaret}
          onFormulaFocus={() => ctx.setFormulaBarActive?.(true)}
          onFormulaBlur={() => ctx.setFormulaBarActive?.(false)}
          onCommit={() => {
            ctx.setFormulaBarActive?.(false)
            ctx.commitActiveCell?.()
            ctx.setEditing(false)
          }}
          readOnly={!ctx.canEdit()}
          nameBoxAria={labels.nameBoxAria}
          formulaBarAria={labels.formulaBarAria}
          className="z-10"
        />
      )
    },
  }
}
