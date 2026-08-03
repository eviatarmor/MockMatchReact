# `@mockmatch/spreadsheet`

Product-agnostic multi-sheet spreadsheet shell (practice / ops tables):

- **Virtualized grid** — sparse cells, frozen headers, keyboard nav (native overflow; not ScrollArea)
- **Sheet tabs** — IDE-style tab chrome (add / rename / switch / delete)
- **Formulas** — HyperFormula (`SUM`, `IF`, ranges, cross-sheet, …)
- **Formula bar** — resizable name box + editor (`ResizablePanelGroup`)
- **Optional collab** — Yjs map helpers; host owns room + share UI

> **Status:** private monorepo package. Chrome + engine only — host owns session/AI/i18n.

## Tailwind

```css
@source "../../packages/spreadsheet/src/**/*.{ts,tsx}";
```

## Quick start

```tsx
import {
  SpreadsheetShell,
  useSpreadsheet,
  createEmptyWorkbook,
} from "@mockmatch/spreadsheet"

function SheetPractice() {
  const sheet = useSpreadsheet({ initial: createEmptyWorkbook() })
  return (
    <SpreadsheetShell
      className="h-full"
      document={sheet.document}
      selection={sheet.selection}
      labels={labels}
      onSelect={sheet.select}
      onCommitCell={sheet.commitCell}
      onSetActiveSheet={sheet.setActiveSheet}
      onAddSheet={sheet.addSheet}
      onRenameSheet={sheet.renameSheet}
      onDeleteSheet={sheet.deleteSheet}
      onReorderSheets={sheet.reorderSheets}
      formulaDraft={sheet.formulaDraft}
      onFormulaDraftChange={sheet.setFormulaDraft}
      onFormulaCommit={sheet.commitFormulaBar}
    />
  )
}
```

## MockMatch host

`/simulations/spreadsheet` — freeform practice workbook.
