import { describe, expect, it, vi } from "vitest"
import {
  collectChrome,
  runPluginKeyDown,
  runPluginPointerDown,
  sortPlugins,
  type SpreadsheetPlugin,
  type SpreadsheetPluginContext,
} from "../../src/plugin-system"
import {
  createDefaultPlugins,
  createKeyboardPlugin,
  createSelectionPlugin,
} from "../../src/plugins"
import { createEmptyWorkbook } from "../../src/document"
import type { SpreadsheetDocument, SpreadsheetSelection } from "../../src/types"

function mockCtx(
  options: {
    editing?: boolean
    selection?: SpreadsheetSelection
    document?: SpreadsheetDocument
    dispatch?: SpreadsheetPluginContext["dispatch"]
    setSelection?: SpreadsheetPluginContext["setSelection"]
    setFormulaDraft?: SpreadsheetPluginContext["setFormulaDraft"]
    setEditing?: SpreadsheetPluginContext["setEditing"]
    canEdit?: boolean
  } = {}
): SpreadsheetPluginContext {
  let doc = options.document ?? createEmptyWorkbook()
  let selection: SpreadsheetSelection = options.selection ?? {
    active: { row: 0, col: 0 },
    range: null,
  }
  let editing = options.editing ?? false
  let draft = ""

  return {
    getDocument: () => doc,
    getSelection: () => selection,
    getFormulaDraft: () => draft,
    isEditing: () => editing,
    canEdit: () => options.canEdit ?? true,
    getDisplay: () => ({
      raw: "",
      display: "",
      isFormula: false,
      error: null,
    }),
    getLabels: () => ({
      formulaBarAria: "formula",
      nameBoxAria: "name",
      gridAria: "grid",
      sheetTabsAria: "tabs",
      addSheet: "add",
      renameSheet: "rename",
      deleteSheet: "delete",
      sheetFallback: (n) => `Sheet${n}`,
      cannotDeleteLastSheet: "cannot",
    }),
    setSelection:
      options.setSelection ??
      ((active, rangeEnd) => {
        selection = {
          active,
          range:
            rangeEnd &&
            (rangeEnd.row !== active.row || rangeEnd.col !== active.col)
              ? { start: active, end: rangeEnd }
              : null,
        }
      }),
    setFormulaDraft:
      options.setFormulaDraft ??
      ((v) => {
        draft = v
      }),
    setEditing:
      options.setEditing ??
      ((v) => {
        editing = v
      }),
    dispatch: options.dispatch ?? vi.fn(),
  }
}

function fakeKey(
  key: string,
  mods: { shiftKey?: boolean; ctrlKey?: boolean } = {}
): KeyboardEvent {
  return {
    key,
    shiftKey: mods.shiftKey ?? false,
    ctrlKey: mods.ctrlKey ?? false,
    metaKey: false,
    altKey: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as KeyboardEvent
}

describe("spreadsheet plugins", () => {
  it("sortPlugins orders by order ascending", () => {
    const plugins: SpreadsheetPlugin[] = [
      { id: "b", order: 50 },
      { id: "a", order: 10 },
      { id: "c" },
    ]
    expect(sortPlugins(plugins).map((p) => p.id)).toEqual(["a", "b", "c"])
  })

  it("createDefaultPlugins has stable feature ids", () => {
    const ids = createDefaultPlugins().map((p) => p.id)
    expect(ids).toEqual([
      "selection",
      "keyboard",
      "cell-edit",
      "resize",
      "formula-bar",
      "sheet-tabs",
      "clipboard",
    ])
  })

  it("runPluginKeyDown stops on first true", () => {
    const a: SpreadsheetPlugin = {
      id: "a",
      order: 1,
      onKeyDown: vi.fn(() => true),
    }
    const b: SpreadsheetPlugin = {
      id: "b",
      order: 2,
      onKeyDown: vi.fn(() => true),
    }
    const ctx = mockCtx()
    const handled = runPluginKeyDown([a, b], fakeKey("ArrowDown"), ctx)
    expect(handled).toBe(true)
    expect(a.onKeyDown).toHaveBeenCalledOnce()
    expect(b.onKeyDown).not.toHaveBeenCalled()
  })

  it("keyboard plugin moves active cell", () => {
    const setSelection = vi.fn()
    const dispatch = vi.fn()
    const ctx = mockCtx({
      selection: { active: { row: 2, col: 3 }, range: null },
      setSelection,
      dispatch,
    })
    const plugins = [createKeyboardPlugin()]
    const e = fakeKey("ArrowDown")
    expect(runPluginKeyDown(plugins, e, ctx)).toBe(true)
    expect(setSelection).toHaveBeenCalledWith({ row: 3, col: 3 }, null)
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ensureBounds" })
    )
  })

  it("selection plugin selects cell on pointer down", () => {
    const setSelection = vi.fn()
    const ctx = mockCtx({ setSelection })
    const plugins = [createSelectionPlugin()]
    const handled = runPluginPointerDown(
      plugins,
      {
        clientX: 0,
        clientY: 0,
        shiftKey: false,
        target: "cell",
        row: 1,
        col: 2,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      },
      ctx
    )
    expect(handled).toBe(true)
    expect(setSelection).toHaveBeenCalledWith({ row: 1, col: 2 }, null)
  })

  it("collectChrome gathers top slot nodes", () => {
    const plugins = createDefaultPlugins()
    const ctx = mockCtx()
    const top = collectChrome(plugins, ctx, "top")
    const bottom = collectChrome(plugins, ctx, "bottom")
    expect(top.length).toBe(1)
    expect(bottom.length).toBe(1)
  })
})
