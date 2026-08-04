# `@mockmatch/spreadsheet`

Product-agnostic multi-sheet spreadsheet shell (practice / ops tables):

- **Plugin host** — selection, keyboard, cell edit, resize, formula bar, sheet tabs, clipboard (whiteboard-style `createDefaultPlugins()`)
- **Virtualized grid** — sparse cells, frozen headers (native overflow)
- **Formulas** — HyperFormula (`SUM`, `IF`, ranges, cross-sheet, …)
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
  createDefaultPlugins,
} from "@mockmatch/spreadsheet"

function SheetPractice() {
  const sheet = useSpreadsheet({ initial: createEmptyWorkbook() })
  return (
    <SpreadsheetShell
      className="h-full"
      document={sheet.document}
      selection={sheet.selection}
      labels={labels}
      getDisplay={sheet.getDisplay}
      formulaDraft={sheet.formulaDraft}
      onFormulaDraftChange={sheet.setFormulaDraft}
      onSelectionChange={sheet.select}
      onDispatch={sheet.dispatch}
      // omit plugins → createDefaultPlugins(); pass [] for bare grid
      plugins={createDefaultPlugins()}
    />
  )
}
```

## Plugins

| Plugin | Role |
|--------|------|
| `selection` | Click / drag range, headers, select-all |
| `keyboard` | Arrows, Tab, Delete (non-edit) |
| `cell-edit` | F2 / type-to-edit, plain cell input |
| `resize` | Col/row edge drag |
| `formula-bar` | Top chrome |
| `sheet-tabs` | Bottom chrome |
| `clipboard` | Ctrl/Cmd+C/V/X TSV |

Rich-text cells (bold/underline via `@mockmatch/document-editor`) are deferred — swap or extend `cell-edit` later.

## MockMatch host

`/simulations/spreadsheet` — freeform practice workbook.
