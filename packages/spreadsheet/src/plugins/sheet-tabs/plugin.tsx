import { SheetTabs } from "../../sheet-tabs"
import type { SpreadsheetPlugin } from "../../plugin-system"

/** Bottom chrome: sheet switcher. */
export function createSheetTabsPlugin(): SpreadsheetPlugin {
  return {
    id: "sheet-tabs",
    order: 60,
    renderChrome(ctx, slot) {
      if (slot !== "bottom") return null
      const doc = ctx.getDocument()
      const labels = ctx.getLabels()
      const readOnly = !ctx.canEdit()
      return (
        <SheetTabs
          key="sheet-tabs"
          sheets={doc.sheets}
          activeSheetId={doc.activeSheetId}
          onSelect={(id) => ctx.dispatch({ type: "setActiveSheet", sheetId: id })}
          onAdd={() => ctx.dispatch({ type: "addSheet" })}
          onRename={(id, name) =>
            ctx.dispatch({ type: "renameSheet", sheetId: id, name })
          }
          onDelete={(id) =>
            ctx.dispatch({ type: "deleteSheet", sheetId: id })
          }
          readOnly={readOnly}
          labels={{
            sheetTabsAria: labels.sheetTabsAria,
            addSheet: labels.addSheet,
            renameSheet: labels.renameSheet,
            deleteSheet: labels.deleteSheet,
            cannotDeleteLastSheet: labels.cannotDeleteLastSheet,
          }}
        />
      )
    },
  }
}
