# `@mockmatch/spreadsheet`

Product-agnostic multi-sheet spreadsheet shell (practice / ops tables):

- **Plugin host** — history, formula-refs, selection, fill, keyboard, cell edit, resize, formula bar, **toolbar**, sheet tabs, format, clipboard, **context menu**
- **Undo/redo** — **Yjs `UndoManager`** on the workbook Y.Doc (Ctrl/Cmd+Z / Y / Shift+Z)
- **Collab** — host wires `document_kind: spreadsheet` room; local Y workbook mirrors to shared CRDT
- **Structure** — insert/delete rows & columns (formula refs adjust, incl. `$`)
- **Cell style** — bold / italic / underline / align / fill / wrap (toolbar + Ctrl+B/I/U)
- **Fill handle** — drag + double-click fill-down; Ctrl+D / Ctrl+R; relative `$` refs
- **Formula refs** — colored tokens + matching grid highlights; click/drag cells to insert `A1` / `A1:B2` while editing `=`
- **Paste special** — Ctrl+Shift+V pastes values
- **Number formats** — general / number / % / currency / integer (toolbar + Ctrl+Shift+1/4/5/`)
- **Keyboard** — arrows, Home/End, Ctrl+Home/End, PageUp/Down, Ctrl+A, Tab, Delete
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
| `keyboard` | Arrows, Home/End, Page, Ctrl+A, Tab, Delete |
| `cell-edit` | F2 / type-to-edit, plain cell input |
| `resize` | Col/row edge drag |
| `formula-bar` | Top chrome |
| `toolbar` | Bold/align/fill + number formats |
| `sheet-tabs` | Bottom chrome |
| `format` | Ctrl+B/I/U + number format shortcuts |
| `clipboard` | Ctrl/Cmd+C/V/X TSV |
| `context-menu` | Right-click: paste, clear, insert/delete row/col |

Rich multi-run text in a cell (document-editor) still deferred; simple style flags cover practice needs.

## MockMatch host

`/simulations/spreadsheet` — freeform practice workbook.
