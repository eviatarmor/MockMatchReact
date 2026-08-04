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
  createFormulaRefsPlugin,
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
    formulaDraft?: string
    formulaBarActive?: boolean
  } = {}
): SpreadsheetPluginContext {
  let doc = options.document ?? createEmptyWorkbook()
  let selection: SpreadsheetSelection = options.selection ?? {
    active: { row: 0, col: 0 },
    range: null,
  }
  let editing = options.editing ?? false
  let draft = options.formulaDraft ?? ""

  let caret = draft.length
  let formulaBarActive = options.formulaBarActive ?? false

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
        caret = v.length
      }),
    setEditing:
      options.setEditing ??
      ((v) => {
        editing = v
      }),
    dispatch: options.dispatch ?? vi.fn(),
    getFormulaCaret: () => caret,
    setFormulaCaret: (n) => {
      caret = n
    },
    isFormulaBarActive: () => formulaBarActive,
    setFormulaBarActive: (v) => {
      formulaBarActive = v
    },
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
      "history",
      "formula-refs",
      "selection",
      "fill",
      "keyboard",
      "cell-edit",
      "resize",
      "formula-bar",
      "sheet-tabs",
      "format",
      "clipboard",
    ])
  })

  it("formula-refs inserts A1 while editing a formula", () => {
    const setFormulaDraft = vi.fn()
    const setSelection = vi.fn()
    const ctx = mockCtx({
      editing: true,
      formulaDraft: "=",
      setFormulaDraft,
      setSelection,
    })
    const plugins = [createFormulaRefsPlugin(), createSelectionPlugin()]
    const preventDefault = vi.fn()
    const handled = runPluginPointerDown(
      plugins,
      {
        clientX: 0,
        clientY: 0,
        shiftKey: false,
        target: "cell",
        row: 1,
        col: 4,
        preventDefault,
        stopPropagation: vi.fn(),
      },
      ctx
    )
    expect(handled).toBe(true)
    expect(preventDefault).toHaveBeenCalled()
    expect(setFormulaDraft).toHaveBeenCalledWith("=E2")
    expect(setSelection).not.toHaveBeenCalled()
  })

  it("formula-refs does not steal clicks when not in formula pick mode", () => {
    const setSelection = vi.fn()
    const ctx = mockCtx({
      editing: false,
      formulaDraft: "hello",
      setSelection,
    })
    const plugins = [createFormulaRefsPlugin(), createSelectionPlugin()]
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

  it("keyboard plugin clears a multi-cell selection on Delete", () => {
    const dispatch = vi.fn()
    const ctx = mockCtx({
      dispatch,
      selection: {
        active: { row: 0, col: 0 },
        range: {
          start: { row: 0, col: 0 },
          end: { row: 1, col: 1 },
        },
      },
    })
    const plugins = [createKeyboardPlugin()]
    const e = fakeKey("Delete")
    expect(runPluginKeyDown(plugins, e, ctx)).toBe(true)
    expect(dispatch).toHaveBeenCalledWith({
      type: "setCells",
      cells: [
        { row: 0, col: 0, raw: "" },
        { row: 0, col: 1, raw: "" },
        { row: 1, col: 0, raw: "" },
        { row: 1, col: 1, raw: "" },
      ],
    })
  })

  it("selection plugin selects full column on col-header click", () => {
    const setSelection = vi.fn()
    const doc = createEmptyWorkbook()
    const sheet = doc.sheets[0]!
    // rowCount/colCount come from createEmptyWorkbook defaults
    const ctx = mockCtx({
      setSelection,
      document: doc,
      selection: { active: { row: 0, col: 0 }, range: null },
    })
    const plugins = [createSelectionPlugin()]
    const handled = runPluginPointerDown(
      plugins,
      {
        clientX: 0,
        clientY: 0,
        shiftKey: false,
        target: "col-header",
        col: 2,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      },
      ctx
    )
    expect(handled).toBe(true)
    expect(setSelection).toHaveBeenCalledWith(
      { row: 0, col: 2 },
      { row: Math.max(0, sheet.rowCount - 1), col: 2 }
    )
  })

  it("selection plugin shift+col-header extends column range", () => {
    const setSelection = vi.fn()
    const doc = createEmptyWorkbook()
    const sheet = doc.sheets[0]!
    const lastRow = Math.max(0, sheet.rowCount - 1)
    const ctx = mockCtx({
      setSelection,
      document: doc,
      selection: {
        active: { row: 0, col: 1 },
        range: {
          start: { row: 0, col: 1 },
          end: { row: lastRow, col: 1 },
        },
      },
    })
    const plugins = [createSelectionPlugin()]
    const handled = runPluginPointerDown(
      plugins,
      {
        clientX: 0,
        clientY: 0,
        shiftKey: true,
        target: "col-header",
        col: 4,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      },
      ctx
    )
    expect(handled).toBe(true)
    expect(setSelection).toHaveBeenCalledWith(
      { row: 0, col: 4 },
      { row: lastRow, col: 1 }
    )
  })

  it("selection plugin shift+row-header extends row range", () => {
    const setSelection = vi.fn()
    const doc = createEmptyWorkbook()
    const sheet = doc.sheets[0]!
    const lastCol = Math.max(0, sheet.colCount - 1)
    const ctx = mockCtx({
      setSelection,
      document: doc,
      selection: {
        active: { row: 2, col: 0 },
        range: {
          start: { row: 2, col: 0 },
          end: { row: 2, col: lastCol },
        },
      },
    })
    const plugins = [createSelectionPlugin()]
    const handled = runPluginPointerDown(
      plugins,
      {
        clientX: 0,
        clientY: 0,
        shiftKey: true,
        target: "row-header",
        row: 6,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      },
      ctx
    )
    expect(handled).toBe(true)
    expect(setSelection).toHaveBeenCalledWith(
      { row: 6, col: 0 },
      { row: 2, col: lastCol }
    )
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
