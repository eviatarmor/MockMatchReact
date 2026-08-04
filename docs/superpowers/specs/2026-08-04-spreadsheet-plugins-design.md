# Spreadsheet plugin architecture

**Date:** 2026-08-04  
**Status:** Approved design  
**Package:** `@mockmatch/spreadsheet`  
**Reference:** `@mockmatch/whiteboard` plugin system

## Problem

Spreadsheet is a monolithic shell: `SpreadsheetShell` hardcodes formula bar, virtualized grid, and sheet tabs; selection, keyboard, edit, and resize live inside `SpreadsheetGrid`. Whiteboard already uses a unified plugin model (`plugin-system/` + `plugins/*` + `createDefaultPlugins()`). Spreadsheet should match that shape so features are swappable, testable in isolation, and extensible without growing the grid file.

## Goals

1. Mirror whiteboard’s plugin model for spreadsheet (not a shared cross-surface runtime package).
2. Extract existing features into plugins: selection, keyboard, cell edit, resize, formula bar, sheet tabs, clipboard (thin).
3. Host API becomes whiteboard-like: `plugins` prop + thinner controlled state; host may break and migrate once.
4. Keep pure core: document ops, address, layout, virtualization, HyperFormula lifecycle.
5. Preserve current product behavior for `/simulations/spreadsheet` (plain cell editor).

## Non-goals (v1)

- Rich text cells (`RichTextField` / bold / underline) — deferred; `cell-edit` keeps plain input.
- New shared package for inline editors.
- Shared plugin runtime with whiteboard (`@mockmatch/surface-plugins` or similar).
- Freeze panes, charts, conditional format, named ranges, undo stack plugin.
- Whiteboard-style left tool rail.

## Architecture

### Package layout

```
packages/spreadsheet/src/
  plugin-system/
    types.ts
    run-plugins.ts
    index.ts
  plugins/
    selection/
    keyboard/
    cell-edit/
    resize/
    formula-bar/
    sheet-tabs/
    clipboard/
    defaults.ts
    index.ts
  grid/spreadsheet-grid.tsx    # thin: virtualize, hit-test, invoke plugins
  spreadsheet-shell.tsx        # layout slots; collects plugin chrome
  use-spreadsheet.ts           # host state: doc, selection, engine, dispatch
  document.ts / address.ts / layout.ts / formula/ / collab/ / types.ts
```

### Core vs plugin

| Stays core | Becomes plugin |
|------------|----------------|
| Document types + pure mutators | Selection (click/drag/range overlays) |
| Address / A1 helpers | Keyboard navigation (when not editing) |
| Layout + virtualization paint | Cell edit (F2, type-to-edit, commit, Escape) |
| HyperFormula engine + `getDisplay` | Col/row resize drag |
| Infinite grow (`ensureBounds`) called via ctx | Formula bar chrome |
| Shell layout slots | Sheet tabs chrome |
| | Clipboard (Ctrl/Cmd+C/V/X, plain TSV; thin v1) |

### Plugin contract

Aligned with whiteboard, spreadsheet-specific contributions for grid chrome:

```ts
type SpreadsheetPlugin = {
  readonly id: string
  /** Feature/hook pipeline order (lower first). Default 100. */
  readonly order?: number
  readonly setup?: (ctx: SpreadsheetPluginContext) => void | (() => void)
  /** Return true to stop the keydown chain. */
  readonly onKeyDown?: (
    e: KeyboardEvent,
    ctx: SpreadsheetPluginContext
  ) => boolean | void
  /**
   * Screen-space chrome. Host shell places by slot:
   * - top → formula bar region
   * - bottom → sheet tabs region
   * - overlay → optional floating UI
   */
  readonly renderChrome?: (
    ctx: SpreadsheetPluginContext,
    slot: "top" | "bottom" | "overlay"
  ) => ReactNode
  /** Active cell editor overlay (positioned over the active cell). */
  readonly renderCellEditor?: (
    ctx: SpreadsheetPluginContext,
    cellRect: { left: number; top: number; width: number; height: number }
  ) => ReactNode
  /** Per-visible-cell decoration (selection fill, active ring). */
  readonly renderCellOverlay?: (
    ctx: SpreadsheetPluginContext,
    cell: {
      row: number
      col: number
      rect: { left: number; top: number; width: number; height: number }
    }
  ) => ReactNode
  /**
   * Pointer pipeline on the grid surface (selection drag, resize handles).
   * Return true to stop further plugins. Grid still owns hit-testing to cell coords.
   */
  readonly onPointerDown?: (
    e: {
      clientX: number
      clientY: number
      shiftKey: boolean
      target: "cell" | "col-header" | "row-header" | "corner" | "col-resize" | "row-resize"
      row?: number
      col?: number
    },
    ctx: SpreadsheetPluginContext
  ) => boolean | void
  readonly onPointerMove?: (
    e: { clientX: number; clientY: number; row?: number; col?: number },
    ctx: SpreadsheetPluginContext
  ) => boolean | void
  readonly onPointerUp?: (
    e: { clientX: number; clientY: number },
    ctx: SpreadsheetPluginContext
  ) => boolean | void
}
```

Helpers (mirror whiteboard): `sortPlugins`, `runPluginKeyDown`, `runPluginPointer*`, collectors for chrome by slot.

### Plugin context

```ts
type SpreadsheetPluginContext = {
  readonly getDocument: () => SpreadsheetDocument
  readonly getSelection: () => SpreadsheetSelection
  readonly getFormulaDraft: () => string
  readonly isEditing: () => boolean
  readonly canEdit: () => boolean
  readonly getDisplay: (row: number, col: number) => DisplayCell
  readonly setSelection: (
    active: CellCoord,
    rangeEnd?: CellCoord | null
  ) => void
  readonly setFormulaDraft: (v: string) => void
  readonly setEditing: (editing: boolean) => void
  readonly dispatch: (command: SpreadsheetCommand) => void
  /** Optional: scroll active cell into view, measure cell rects. */
  readonly scrollCellIntoView?: (coord: CellCoord) => void
  readonly getActiveCellRect?: () => {
    left: number
    top: number
    width: number
    height: number
  } | null
}
```

### Command bus (document mutations)

Selection and formula draft remain UI state (not document commands).

```ts
type SpreadsheetCommand =
  | { type: "setCell"; row: number; col: number; raw: string }
  | { type: "setActiveSheet"; sheetId: string }
  | { type: "addSheet" }
  | { type: "renameSheet"; sheetId: string; name: string }
  | { type: "deleteSheet"; sheetId: string }
  | { type: "reorderSheets"; orderedIds: string[] }
  | { type: "setColWidth"; col: number; width: number }
  | { type: "setRowHeight"; row: number; height: number }
  | { type: "ensureBounds"; minRows: number; minCols: number }
```

`useSpreadsheet` exposes `dispatch` that routes to existing mutators (`commitCell`, `setActiveSheet`, …). Individual methods may remain for convenience.

### Keydown pipeline

1. Sort plugins by `order`.
2. When `isEditing()`, `cell-edit` handles Enter / Tab / Escape first.
3. Otherwise: keyboard → clipboard → …
4. First plugin returning `true` stops the chain (same as whiteboard `runPluginKeyDown`).

## Default plugins

`createDefaultPlugins()` returns fresh instances (no shared mutable clipboard state across hosts):

| Plugin id | order | Responsibility |
|-----------|-------|----------------|
| `selection` | 10 | Pointer select/drag range; shift-extend; row/col/all select hooks; selection overlays |
| `keyboard` | 20 | Arrows, Tab, Enter-to-move (non-edit), Delete/Backspace clear; scroll-into-view |
| `cell-edit` | 30 | F2 / type-to-edit; plain input editor; commit via `setCell`; Escape restore |
| `resize` | 40 | Column/row edge drag → `setColWidth` / `setRowHeight` |
| `formula-bar` | 50 | `renderChrome("top")` wrapping existing `FormulaBar` |
| `sheet-tabs` | 60 | `renderChrome("bottom")` wrapping existing `SheetTabs` |
| `clipboard` | 70 | Ctrl/Cmd+C/V/X when not editing; plain text / TSV (thin; may no-op incomplete paths) |

Omit `plugins` on shell → internal default via `createDefaultPlugins()` (whiteboard canvas pattern).  
Pass `plugins={[]}` → bare grid core (tests / embeds).

## Shell composition

```
SpreadsheetShell
  host chrome? (IdeChromeBar slot — stays host-owned)
  plugins → renderChrome(ctx, "top")
  SpreadsheetGrid (virtualize + plugin overlays + cell editor)
  plugins → renderChrome(ctx, "bottom")
  plugins → renderChrome(ctx, "overlay")
```

`FormulaBar`, `SheetTabs`, and `SpreadsheetGrid` remain **public exports**. Plugins wrap them; custom hosts can still compose without the plugin pipeline if needed.

## Host migration

**Today:** many callbacks (`onSelect`, `onCommitCell`, `onAddSheet`, …).

**Target:**

```tsx
const sheet = useSpreadsheet({ initial })

<SpreadsheetShell
  document={sheet.document}
  selection={sheet.selection}
  formulaDraft={sheet.formulaDraft}
  getDisplay={sheet.getDisplay}
  labels={labels}
  plugins={createDefaultPlugins()} // or omit for default
  onDispatch={sheet.dispatch}
  // UI state still controlled or via dispatch-adjacent setters:
  onSelectionChange={sheet.select}
  onFormulaDraftChange={sheet.setFormulaDraft}
  chrome={…}
  readOnly={…}
/>
```

Exact prop names may collapse further during implementation if `useSpreadsheet` + a single `api` object is cleaner; the invariant is: **plugins receive a context**, host owns document/engine/collab.

Primary host: `client/src/features/simulation-spreadsheet/`.

## Cell editing (v1 vs later)

### v1

- `cell-edit` uses the current plain string editor (`input` / formula draft).
- `SpreadsheetCell.raw` remains a string (literal or formula starting with `=`).
- No dependency on `@mockmatch/document-editor` required for this refactor.

### Later (not in this work)

Dual-mode editor was explored and deferred:

- `raw` starting with `=` → plain formula editor.
- Otherwise → `RichTextField` from `@mockmatch/document-editor` with floating bold/italic/underline toolbar.
- Formula bar stays plain string for v1 of that future work.

Plugin boundary is chosen so this can land as a change inside `cell-edit` (or a replaceable plugin) without rewriting the grid core.

## Testing

| Layer | Coverage |
|-------|----------|
| `tests/unit/plugins.test.ts` | Plugin sort order, keydown stop-on-true, default plugin ids, chrome collectors |
| Existing unit tests | document, formula engine, address, layout, yjs — behavior preserved |
| Host | Simulation page types + runtime with new shell props |
| Manual | User verifies `/simulations/spreadsheet` (select, edit, tabs, formula bar, resize) |

## Implementation order

1. Add `plugin-system` types, runners, and empty `createDefaultPlugins`.
2. Extract plugins from current grid/shell **behavior-preserving** (no UX change).
3. Thin `SpreadsheetGrid` / `SpreadsheetShell` to host + pipeline only.
4. Add `dispatch` on `useSpreadsheet`; migrate simulation host.
5. Unit tests for plugin pipeline; keep existing unit suite green.
6. Update package README; no public product docs change unless simulation UX copy changes (it should not).

## Success criteria

- Spreadsheet features used today work via `createDefaultPlugins()` with no intentional product regression.
- `plugins={[]}` yields a non-interactive-chrome grid (no formula bar / tabs / default selection behavior unless re-added).
- Host can pass a custom plugin list and omit or replace individual features.
- Architecture is recognizably parallel to whiteboard’s `plugin-system` + `plugins` + `defaults`.
- Rich text cells are not implemented, but the design does not block a future `cell-edit` upgrade.
