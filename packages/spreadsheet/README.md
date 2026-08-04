# `@mockmatch/spreadsheet`

Product-agnostic multi-sheet spreadsheet shell (practice / ops tables):

- **Plugin host** — history, formula-refs, selection, fill, keyboard, cell edit, resize, formula bar, sheet tabs, format, clipboard
- **Undo/redo** — **Yjs `UndoManager`** on the workbook Y.Doc (Ctrl/Cmd+Z / Y / Shift+Z)
- **Collab** — host wires `document_kind: spreadsheet` room; local Y workbook mirrors to shared CRDT
- **Fill handle** — drag + double-click fill-down; Ctrl+D / Ctrl+R; relative `$` refs
- **Formula refs** — colored tokens + matching grid highlights; click/drag cells to insert `A1` / `A1:B2` while editing `=`
- **Paste special** — Ctrl+Shift+V pastes values
- **Number formats** — general / number / % / currency / integer (Ctrl+Shift+1/4/5/`)
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
| `formula-refs` | Grid ref highlights + click/drag insert while editing formula |
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
