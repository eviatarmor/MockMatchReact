import { describe, expect, it, vi } from "vitest"
import {
  buildToolRegistry,
  collectElements,
  collectTools,
  runPluginDoubleClick,
  runPluginKeyDown,
  runPluginSelectDoubleActivate,
  sortPlugins,
  sortRailPlugins,
  type WhiteboardPlugin,
  type WhiteboardPluginContext,
} from "@/plugin-system"
import {
  createClipboardPlugin,
  createDefaultPlugins,
  createMinimapPlugin,
  createSelectPlugin,
  createShapeLabelPlugin,
  createTextEditPlugin,
} from "@/plugins"
import {
  createEmptyBoard,
  createShape,
  createText,
  maxZ,
} from "@/document"
import type {
  WhiteboardCommand,
  WhiteboardDocument,
  WhiteboardTool,
} from "@/types"

function fakeKey(
  key: string,
  code: string,
  mods: { ctrlKey?: boolean } = {}
): KeyboardEvent {
  return {
    key,
    code,
    ctrlKey: mods.ctrlKey ?? false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: null,
  } as unknown as KeyboardEvent
}

function mockCtx(options: {
  getDocument?: () => WhiteboardDocument
  getSelectedIds?: () => string[]
  dispatch?: (cmd: WhiteboardCommand) => void
  setSelectedIds?: (ids: string[]) => void
  setEditingId?: (id: string | null) => void
  tool?: WhiteboardTool
} = {}): WhiteboardPluginContext {
  let doc = createEmptyBoard()
  let selectedIds: string[] = []
  let editingId: string | null = null

  return {
    getDocument: options.getDocument ?? (() => doc),
    getTool: () => options.tool ?? "select",
    getSelectedIds: options.getSelectedIds ?? (() => selectedIds),
    getEditingId: () => editingId,
    canEdit: () => true,
    dispatch:
      options.dispatch ??
      ((cmd) => {
        if (cmd.type === "upsert") {
          doc = {
            ...doc,
            elements: { ...doc.elements, [cmd.element.id]: cmd.element },
          }
        } else if (cmd.type === "upsertMany") {
          const next = { ...doc.elements }
          for (const el of cmd.elements) next[el.id] = el
          doc = { ...doc, elements: next }
        } else if (cmd.type === "remove") {
          const next = { ...doc.elements }
          for (const id of cmd.ids) delete next[id]
          doc = { ...doc, elements: next }
        }
      }),
    setSelectedIds:
      options.setSelectedIds ??
      ((ids) => {
        selectedIds = ids
      }),
    setEditingId:
      options.setEditingId ??
      ((id) => {
        editingId = id
      }),
    clientToBoard: (x, y) => ({ x, y }),
    hitTestAt: () => null,
    isNativeTextTarget: () => false,
  }
}

describe("unified plugins", () => {
  it("createDefaultPlugins includes tools + features + minimap + elements", () => {
    const ids = createDefaultPlugins().map((p) => p.id)
    expect(ids).toContain("select")
    expect(ids).toContain("draw")
    expect(ids).toContain("connector")
    expect(ids).toContain("clipboard")
    expect(ids).toContain("shape-label")
    expect(ids).toContain("text-edit")
    expect(ids).toContain("minimap")
    expect(ids).toContain("elements")
  })

  it("collectTools registers pen and connector", () => {
    const reg = buildToolRegistry(collectTools(createDefaultPlugins()))
    expect(reg.has("pen")).toBe(true)
    expect(reg.has("connector")).toBe(true)
    expect(reg.get("select")?.onPointerDown).toBeTypeOf("function")
  })

  it("collectElements registers sticky/shape/path", () => {
    const els = collectElements(createDefaultPlugins())
    expect(els.has("sticky")).toBe(true)
    expect(els.has("shape")).toBe(true)
    expect(els.has("path")).toBe(true)
    expect(els.has("connector")).toBe(true)
  })

  it("sortRailPlugins only keeps rail plugins in order", () => {
    const rail = sortRailPlugins(createDefaultPlugins()).map((p) => p.id)
    expect(rail[0]).toBe("select")
    expect(rail).toContain("draw")
    expect(rail).not.toContain("clipboard")
    expect(rail).not.toContain("minimap")
  })

  it("minimap plugin exposes renderChrome", () => {
    const p = createMinimapPlugin()
    expect(p.renderChrome).toBeTypeOf("function")
  })

  it("select plugin contributes rail + tools", () => {
    const p = createSelectPlugin()
    expect(p.rail?.primary?.id).toBe("select")
    expect(p.tools?.[0]?.id).toBe("select")
  })
})

describe("sortPlugins", () => {
  it("orders by order ascending", () => {
    const a: WhiteboardPlugin = { id: "a", order: 30 }
    const b: WhiteboardPlugin = { id: "b", order: 10 }
    expect(sortPlugins([a, b]).map((p) => p.id)).toEqual(["b", "a"])
  })
})

describe("clipboard plugin", () => {
  it("copies and pastes", () => {
    const shape = createShape({ x: 0, y: 0 })
    let store: WhiteboardDocument = {
      version: 1,
      elements: { [shape.id]: shape },
    }
    let selectedIds = [shape.id]
    const ctx = mockCtx({
      getDocument: () => store,
      getSelectedIds: () => selectedIds,
      dispatch: (cmd) => {
        if (cmd.type === "upsertMany") {
          const next = { ...store.elements }
          for (const el of cmd.elements) next[el.id] = el
          store = { ...store, elements: next }
        }
      },
      setSelectedIds: (ids) => {
        selectedIds = ids
      },
    })
    const plugin = createClipboardPlugin()
    expect(
      runPluginKeyDown([plugin], fakeKey("c", "KeyC", { ctrlKey: true }), ctx)
    ).toBe(true)
    expect(
      runPluginKeyDown([plugin], fakeKey("v", "KeyV", { ctrlKey: true }), ctx)
    ).toBe(true)
    expect(Object.keys(store.elements).length).toBe(2)
  })
})

describe("shape-label / text-edit", () => {
  it("shape label on double-click", () => {
    const shape = createShape({ x: 10, y: 10, shape: "rect" })
    const doc: WhiteboardDocument = {
      version: 1,
      elements: { [shape.id]: shape },
    }
    let editingId: string | null = null
    const ctx = mockCtx({
      getDocument: () => doc,
      setEditingId: (id) => {
        editingId = id
      },
    })
    expect(
      runPluginDoubleClick(
        [createShapeLabelPlugin()],
        {
          clientX: 0,
          clientY: 0,
          boardX: 20,
          boardY: 20,
          hitId: shape.id,
        },
        ctx
      )
    ).toBe(true)
    expect(editingId).toBe(shape.id)
  })

  it("text-edit creates on empty double-click", () => {
    let store = createEmptyBoard()
    let editingId: string | null = null
    const ctx = mockCtx({
      getDocument: () => store,
      dispatch: (cmd) => {
        if (cmd.type === "upsert") {
          store = {
            ...store,
            elements: { ...store.elements, [cmd.element.id]: cmd.element },
          }
        }
      },
      setEditingId: (id) => {
        editingId = id
      },
    })
    expect(
      runPluginDoubleClick(
        [createTextEditPlugin()],
        {
          clientX: 0,
          clientY: 0,
          boardX: 100,
          boardY: 50,
          hitId: null,
        },
        ctx
      )
    ).toBe(true)
    expect(Object.keys(store.elements)).toHaveLength(1)
    expect(editingId).toBeTruthy()
    expect(maxZ(store)).toBeGreaterThan(0)
  })

  it("ignores line-like shapes for label", () => {
    const line = createShape({ x: 0, y: 0, shape: "line" })
    const doc: WhiteboardDocument = {
      version: 1,
      elements: { [line.id]: line },
    }
    expect(
      runPluginSelectDoubleActivate(
        [createShapeLabelPlugin()],
        { elementId: line.id, boardX: 0, boardY: 0 },
        mockCtx({ getDocument: () => doc })
      )
    ).toBe(false)
  })
})
