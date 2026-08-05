import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { hitTest, listElementsSorted } from "../document"
import {
  applyResize,
  closestPort,
  elementPorts,
  type ResizeHandle,
} from "../lib/flowchart"
import {
  buildToolRegistry,
  collectElements,
  collectTools,
  pointerFromEvent,
  runPluginDoubleClick,
  runPluginKeyDown,
  runPluginSelectDoubleActivate,
  sortPlugins,
  type InteractionHost,
  type ToolGesture,
  type ViewportAccess,
  type WhiteboardPlugin,
  type WhiteboardPluginContext,
} from "../plugin-system"
import { createDefaultPlugins } from "../plugins"
import { WHITEBOARD_ZOOM, type WhiteboardViewport } from "../viewport"
import type {
  DrawStrokeStyle,
  ShapeKind,
  ShapeLabelEditorLabels,
  WhiteboardCommand,
  WhiteboardDocument,
  WhiteboardTool,
} from "../types"
import { DEFAULT_HIGHLIGHTER_STYLE, DEFAULT_PEN_STYLE } from "../types"
import { ElementView } from "./elements"

const GRID_DOT_FALLBACK = 24
const BOARD_SIZE = 3000

export type WhiteboardCanvasProps = {
  readonly document: WhiteboardDocument
  readonly tool: WhiteboardTool
  readonly viewport: WhiteboardViewport
  readonly selectedIds: readonly string[]
  readonly onSelectedIdsChange: (ids: string[]) => void
  readonly onCommand: (command: WhiteboardCommand) => void
  readonly canEdit?: boolean
  readonly shapeKind?: ShapeKind
  readonly penStyle?: DrawStrokeStyle
  readonly highlighterStyle?: DrawStrokeStyle
  readonly smartStyle?: DrawStrokeStyle
  readonly stickyColor?: string
  readonly shapeColor?: string
  readonly eraserRadius?: number
  readonly precisionEraserRadius?: number
  readonly shapeLabelLabels?: ShapeLabelEditorLabels
  /**
   * Unified plugins (tools, rail, clipboard, elements, …).
   * Default: createDefaultPlugins(). Pass [] for bare core.
   * Prefer the same list on WhiteboardToolRail.
   */
  readonly plugins?: readonly WhiteboardPlugin[]
  /** @deprecated Use `plugins` only. */
  readonly toolPlugins?: readonly WhiteboardPlugin[]
  /**
   * Optional ref to the board plane (layout px = BOARD_SIZE).
   * Host uses this for collab cursor mapping under pan/zoom.
   */
  readonly surfaceRef?: Ref<HTMLDivElement | null>
  /** Drawn in board space under the same transform (e.g. remote cursors). */
  readonly boardOverlay?: ReactNode
}

/**
 * Thin interaction host.
 * Behavior comes only from `plugins` (tools, elements, features, chrome).
 */
export function WhiteboardCanvas({
  document: doc,
  tool,
  viewport,
  selectedIds,
  onSelectedIdsChange,
  onCommand,
  canEdit = true,
  shapeKind = "rect",
  penStyle = DEFAULT_PEN_STYLE,
  highlighterStyle = DEFAULT_HIGHLIGHTER_STYLE,
  smartStyle = DEFAULT_PEN_STYLE,
  stickyColor = "#fef08a",
  shapeColor = "#171717",
  eraserRadius = 14,
  precisionEraserRadius = 6,
  shapeLabelLabels,
  plugins: pluginsProp,
  toolPlugins,
  surfaceRef: surfaceRefProp,
  boardOverlay,
}: WhiteboardCanvasProps) {
  const { ref, scale, onTransform, bindGridLayer, resetView } = viewport
  const surfaceInnerRef = useRef<HTMLDivElement>(null)
  const surfaceRef = surfaceInnerRef
  const setSurfaceRef = useCallback(
    (el: HTMLDivElement | null) => {
      surfaceInnerRef.current = el
      const ext = surfaceRefProp
      if (!ext) return
      if (typeof ext === "function") ext(el)
      else (ext as { current: HTMLDivElement | null }).current = el
    },
    [surfaceRefProp]
  )
  const docRef = useRef(doc)
  docRef.current = doc

  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [overlays, setOverlays] = useState<Record<string, ReactNode>>({})
  const didInitCenter = useRef(false)
  const surfaceRectCacheRef = useRef<DOMRect | null>(null)
  const overlayPendingRef = useRef<Record<string, ReactNode | null>>({})
  const overlayRafRef = useRef(0)

  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const editingLabelIdRef = useRef(editingLabelId)
  editingLabelIdRef.current = editingLabelId
  const toolRef = useRef(tool)
  toolRef.current = tool
  const canEditRef = useRef(canEdit)
  canEditRef.current = canEdit
  const onCommandRef = useRef(onCommand)
  onCommandRef.current = onCommand
  const onSelectedIdsChangeRef = useRef(onSelectedIdsChange)
  onSelectedIdsChangeRef.current = onSelectedIdsChange
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport

  // Options bag (plugins read via host.getOption — core stays agnostic)
  const optionsRef = useRef({
    shapeKind,
    penStyle,
    highlighterStyle,
    smartStyle,
    stickyColor,
    shapeColor,
    eraserRadius,
    precisionEraserRadius,
  })
  optionsRef.current = {
    shapeKind,
    penStyle,
    highlighterStyle,
    smartStyle,
    stickyColor,
    shapeColor,
    eraserRadius,
    precisionEraserRadius,
  }

  const defaultPluginsRef = useRef<WhiteboardPlugin[] | null>(null)
  if (!defaultPluginsRef.current) {
    defaultPluginsRef.current = createDefaultPlugins()
  }

  const plugins = pluginsProp ?? toolPlugins ?? defaultPluginsRef.current
  const sortedPlugins = useMemo(() => sortPlugins(plugins), [plugins])
  const toolRegistry = useMemo(
    () => buildToolRegistry(collectTools(plugins)),
    [plugins]
  )
  const elementRenderers = useMemo(
    () => collectElements(plugins),
    [plugins]
  )

  const activeToolDef = toolRegistry.get(tool)
  const passThroughElements = Boolean(activeToolDef?.passThroughElements)
  const cursor = activeToolDef?.cursor ?? "default"

  // Surface rect moves with pan/zoom — invalidate cache cheaply via viewport bus
  useEffect(() => {
    surfaceRectCacheRef.current = null
    return viewport.subscribeTransform(() => {
      surfaceRectCacheRef.current = null
    })
  }, [viewport, scale])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      surfaceRectCacheRef.current = null
    })
    ro.observe(surface)
    return () => ro.disconnect()
  }, [])

  /**
   * Client (screen) → board layout coords under pan/zoom.
   * Use visual rect vs layout size (offsetWidth/Height) — same approach as
   * resume collab surface. Do **not** divide by React `scale` alone: that
   * desyncs mid-zoom and breaks drag/resize hit testing when zoomed.
   */
  const clientToBoard = useCallback((clientX: number, clientY: number) => {
    const surface = surfaceRef.current
    if (!surface) return { x: 0, y: 0 }
    let rect = surfaceRectCacheRef.current
    if (!rect) {
      rect = surface.getBoundingClientRect()
      surfaceRectCacheRef.current = rect
    }
    const layoutW = surface.offsetWidth || BOARD_SIZE
    const layoutH = surface.offsetHeight || BOARD_SIZE
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 }
    return {
      x: ((clientX - rect.left) * layoutW) / rect.width,
      y: ((clientY - rect.top) * layoutH) / rect.height,
    }
  }, [])
  const clientToBoardRef = useRef(clientToBoard)
  clientToBoardRef.current = clientToBoard

  const isNativeTextTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    if (editingLabelIdRef.current) {
      if (
        target.isContentEditable ||
        target.closest("[data-shape-label-editor]") ||
        target.closest('[contenteditable="true"]')
      ) {
        return true
      }
    }
    const tag = target.tagName
    if (tag === "TEXTAREA" || tag === "INPUT") {
      const elId = target.closest("[data-el-id]")?.getAttribute("data-el-id")
      const ids = selectedIdsRef.current
      if (ids.length === 0) return true
      if (ids.length === 1 && elId && ids[0] === elId) return true
      return false
    }
    if (target.isContentEditable) return true
    return false
  }, [])
  const isNativeTextTargetRef = useRef(isNativeTextTarget)
  isNativeTextTargetRef.current = isNativeTextTarget

  /** Coalesce overlay React updates to 1/frame during stroke/marquee. */
  const setOverlay = useCallback((key: string, node: ReactNode | null) => {
    overlayPendingRef.current[key] = node
    if (overlayRafRef.current) return
    overlayRafRef.current = requestAnimationFrame(() => {
      overlayRafRef.current = 0
      const pending = overlayPendingRef.current
      overlayPendingRef.current = {}
      setOverlays((prev) => {
        let next = prev
        let changed = false
        for (const [k, v] of Object.entries(pending)) {
          if (v == null) {
            if (k in next) {
              if (!changed) {
                next = { ...next }
                changed = true
              }
              delete next[k]
            }
          } else if (next[k] !== v) {
            if (!changed) {
              next = { ...next }
              changed = true
            }
            next[k] = v
          }
        }
        return changed ? next : prev
      })
    })
  }, [])

  const clearOverlays = useCallback(() => {
    overlayPendingRef.current = {}
    if (overlayRafRef.current) {
      cancelAnimationFrame(overlayRafRef.current)
      overlayRafRef.current = 0
    }
    setOverlays({})
  }, [])

  const getViewportAccess = useCallback((): ViewportAccess | null => {
    const vp = viewportRef.current
    const api = vp.ref.current
    if (!api) return null
    const t = vp.transformRef.current
    return {
      scale: t.scale,
      positionX: t.x,
      positionY: t.y,
      boardSize: BOARD_SIZE,
      centerOnBoardPoint: vp.centerOnBoardPoint,
      setTransform: (x, y, s) => {
        api.setTransform(x, y, s, 0)
      },
      getWrapperSize: () => {
        const w = api.instance.wrapperComponent
        return {
          w: w?.clientWidth ?? 0,
          h: w?.clientHeight ?? 0,
        }
      },
      subscribeTransform: vp.subscribeTransform,
    }
  }, [])

  // Plugin context — rebuilt via refs so handlers stay current
  const featureCtx: WhiteboardPluginContext = useMemo(
    () => ({
      getDocument: () => docRef.current,
      getTool: () => toolRef.current,
      getSelectedIds: () => selectedIdsRef.current,
      getEditingId: () => editingLabelIdRef.current,
      canEdit: () => canEditRef.current,
      dispatch: (c) => onCommandRef.current(c),
      setSelectedIds: (ids) => onSelectedIdsChangeRef.current(ids),
      setEditingId: (id) => setEditingLabelId(id),
      clientToBoard: (cx, cy) => clientToBoardRef.current(cx, cy),
      hitTestAt: (x, y) => hitTest(docRef.current, x, y),
      isNativeTextTarget: (t) => isNativeTextTargetRef.current(t),
      getViewport: () => getViewportAccess(),
    }),
    [getViewportAccess]
  )

  const sortedPluginsRef = useRef(sortedPlugins)
  sortedPluginsRef.current = sortedPlugins
  const featureCtxRef = useRef(featureCtx)
  featureCtxRef.current = featureCtx

  const host: InteractionHost = useMemo(
    () => ({
      getDocument: () => docRef.current,
      getTool: () => toolRef.current,
      getSelectedIds: () => selectedIdsRef.current,
      getEditingId: () => editingLabelIdRef.current,
      canEdit: () => canEditRef.current,
      dispatch: (c) => onCommandRef.current(c),
      setSelectedIds: (ids) => onSelectedIdsChangeRef.current(ids),
      setEditingId: (id) => setEditingLabelId(id),
      clientToBoard: (cx, cy) => clientToBoardRef.current(cx, cy),
      hitTestAt: (x, y) => hitTest(docRef.current, x, y),
      getOption: <T,>(key: string, fallback: T): T => {
        const bag = optionsRef.current as Record<string, unknown>
        return (key in bag ? bag[key] : fallback) as T
      },
      setOverlay,
      clearOverlays,
      runSelectDoubleActivate: (elementId, boardX, boardY) =>
        runPluginSelectDoubleActivate(
          sortedPluginsRef.current,
          { elementId, boardX, boardY },
          featureCtxRef.current
        ),
      isNativeTextTarget: (t) => isNativeTextTargetRef.current(t),
    }),
    [setOverlay, clearOverlays]
  )

  // Plugin setup + keydown
  useEffect(() => {
    const disposers: Array<void | (() => void)> = []
    for (const plugin of sortedPlugins) {
      disposers.push(plugin.setup?.(featureCtx))
    }
    const onKeyDown = (e: KeyboardEvent) => {
      runPluginKeyDown(sortedPlugins, e, featureCtx)
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      for (const d of disposers) d?.()
    }
  }, [sortedPlugins, featureCtx])

  useEffect(() => {
    let raf = 0
    const tryBind = () => {
      const wrapper = ref.current?.instance?.wrapperComponent ?? null
      if (wrapper) {
        bindGridLayer(wrapper)
        return
      }
      raf = requestAnimationFrame(tryBind)
    }
    tryBind()
    return () => cancelAnimationFrame(raf)
  }, [ref, bindGridLayer])

  // --- Gesture session (owned by host, data owned by active tool) ---
  const gestureRef = useRef<{
    toolId: string
    data: ToolGesture
  } | null>(null)

  const captureBoard = (e: { pointerId: number }) => {
    surfaceRef.current?.setPointerCapture?.(e.pointerId)
    const pointerId = e.pointerId
    const onWinMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      onBoardPointerMove(ev as unknown as React.PointerEvent)
    }
    const onWinUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      window.removeEventListener("pointermove", onWinMove)
      window.removeEventListener("pointerup", onWinUp)
      window.removeEventListener("pointercancel", onWinUp)
      onBoardPointerUp(ev as unknown as React.PointerEvent)
    }
    window.addEventListener("pointermove", onWinMove)
    window.addEventListener("pointerup", onWinUp)
    window.addEventListener("pointercancel", onWinUp)
  }

  const onBoardPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if (tool === "pan") return
    if (!canEdit && tool !== "select" && tool !== "lasso") return
    if (e.buttons === 4) return

    const def = toolRegistry.get(tool)
    if (!def?.onPointerDown) return

    const board = clientToBoard(e.clientX, e.clientY)
    const pointer = pointerFromEvent(e, board)
    const gesture = def.onPointerDown(pointer, host)
    if (gesture) {
      gestureRef.current = { toolId: def.id, data: gesture }
      captureBoard(e)
    }
  }

  const onBoardPointerMove = (e: React.PointerEvent) => {
    const session = gestureRef.current
    if (!session) return
    const board = clientToBoard(e.clientX, e.clientY)

    // Element chrome resize (not a tool module)
    if (session.toolId === "__resize__" && canEdit) {
      const g = session.data as {
        type: "resize"
        id: string
        handle: ResizeHandle
        start: { x: number; y: number; w: number; h: number }
      }
      const next = applyResize(g.start, g.handle, board.x, board.y)
      onCommand({
        type: "patch",
        id: g.id,
        patch: next as Partial<import("../types").WhiteboardElement>,
      })
      return
    }

    const def = toolRegistry.get(session.toolId)
    if (!def?.onPointerMove) return
    const pointer = pointerFromEvent(e, board)
    const next = def.onPointerMove(pointer, session.data, host)
    if (next) session.data = next
  }

  const onBoardPointerUp = (e: React.PointerEvent) => {
    const session = gestureRef.current
    gestureRef.current = null
    if (!session) return

    if (session.toolId === "__resize__") return

    const def = toolRegistry.get(session.toolId)
    if (!def?.onPointerUp) {
      clearOverlays()
      return
    }
    const board = clientToBoard(e.clientX, e.clientY)
    const pointer = pointerFromEvent(e, board)
    def.onPointerUp(pointer, session.data, host)
  }

  const onBoardDoubleClick = (e: React.MouseEvent) => {
    if (!canEdit || tool !== "select") return
    e.preventDefault()
    e.stopPropagation()
    const { x, y } = clientToBoard(e.clientX, e.clientY)
    const hitId = hitTest(docRef.current, x, y)
    runPluginDoubleClick(
      sortedPlugins,
      {
        clientX: e.clientX,
        clientY: e.clientY,
        boardX: x,
        boardY: y,
        hitId,
      },
      featureCtx
    )
  }

  const elements = useMemo(() => listElementsSorted(doc), [doc])
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const isPanTool = tool === "pan"

  const onStartLabelEdit = useCallback((id: string) => {
    setEditingLabelId(id)
    onSelectedIdsChangeRef.current([id])
  }, [])
  const onEndLabelEdit = useCallback(() => setEditingLabelId(null), [])
  const onSelectElement = useCallback((id: string) => {
    onSelectedIdsChangeRef.current([id])
    if (editingLabelIdRef.current && editingLabelIdRef.current !== id) {
      setEditingLabelId(null)
    }
  }, [])

  const onTextChange = useCallback(
    (id: string, text: string) => {
      if (!canEditRef.current) return
      const existing = docRef.current.elements[id]
      if (!existing) return
      if (existing.type === "sticky" || existing.type === "text") {
        onCommandRef.current({
          type: "patch",
          id,
          patch: { text } as Partial<typeof existing>,
        })
      } else if (existing.type === "shape") {
        onCommandRef.current({
          type: "patch",
          id,
          patch: { label: text } as Partial<typeof existing>,
        })
      }
    },
    []
  )

  const onPointerDownElement = useCallback(
    (id: string, ev: React.PointerEvent) => {
      const currentTool = toolRef.current
      if (currentTool === "pan") return
      const defActive = toolRegistry.get(currentTool)
      if (defActive?.passThroughElements) return
      if (editingLabelIdRef.current === id) return

      if (currentTool === "connector" && canEditRef.current) {
        ev.stopPropagation()
        ev.preventDefault()
        const { x, y } = clientToBoardRef.current(ev.clientX, ev.clientY)
        const hitEl = docRef.current.elements[id]
        const port = hitEl ? closestPort(hitEl, x, y) : null
        const def = toolRegistry.get("connector")
        if (!def?.onPointerDown) return
        const pointer = pointerFromEvent(ev, {
          x: port?.x ?? x,
          y: port?.y ?? y,
        })
        const g = def.onPointerDown(
          {
            ...pointer,
            boardX: port?.x ?? x,
            boardY: port?.y ?? y,
          },
          host
        )
        if (g) {
          gestureRef.current = { toolId: "connector", data: g }
          captureBoard(ev)
        }
        return
      }

      if (currentTool !== "select" || !canEditRef.current) return
      const def = toolRegistry.get("select")
      if (!def?.onPointerDown) return
      const board = clientToBoardRef.current(ev.clientX, ev.clientY)
      const pointer = pointerFromEvent(ev, board)
      const g = def.onPointerDown(pointer, host)
      if (g) {
        gestureRef.current = { toolId: "select", data: g }
        captureBoard(ev)
      }
    },
    [host, toolRegistry]
  )

  const onPortPointerDown = useCallback(
    (
      elementId: string,
      anchor: import("../types").ConnectorAnchor,
      ev: React.PointerEvent
    ) => {
      if (!canEditRef.current) return
      ev.stopPropagation()
      ev.preventDefault()
      const hitEl = docRef.current.elements[elementId]
      const port = hitEl
        ? elementPorts(hitEl)?.find((p) => p.anchor === anchor)
        : null
      const p = port ?? { x: 0, y: 0, anchor }
      const def = toolRegistry.get("connector")
      if (!def?.onPointerDown) return
      const pointer = pointerFromEvent(ev, { x: p.x, y: p.y })
      const g = def.onPointerDown(
        { ...pointer, boardX: p.x, boardY: p.y },
        host
      )
      if (g) {
        gestureRef.current = { toolId: "connector", data: g }
        captureBoard(ev)
      }
    },
    [host, toolRegistry]
  )

  const onResizePointerDown = useCallback(
    (elementId: string, handle: ResizeHandle, ev: React.PointerEvent) => {
      if (!canEditRef.current) return
      ev.stopPropagation()
      const hitEl = docRef.current.elements[elementId]
      if (!hitEl || hitEl.type === "path" || hitEl.type === "connector") return
      gestureRef.current = {
        toolId: "__resize__",
        data: {
          type: "resize",
          id: elementId,
          handle,
          start: {
            x: hitEl.x,
            y: hitEl.y,
            w: hitEl.w,
            h: hitEl.h,
          },
        },
      }
      captureBoard(ev)
    },
    []
  )

  return (
    <div className="relative h-full w-full min-h-0">
      <TransformWrapper
        ref={ref}
        initialScale={WHITEBOARD_ZOOM.default}
        minScale={WHITEBOARD_ZOOM.min}
        maxScale={WHITEBOARD_ZOOM.max}
        centerOnInit={false}
        initialPositionX={0}
        initialPositionY={0}
        limitToBounds={false}
        doubleClick={{ disabled: true }}
        wheel={{ disabled: true }}
        panning={{
          excluded: isPanTool ? [] : ["pan-ignore"],
          allowLeftClickPan: isPanTool,
          allowMiddleClickPan: true,
          allowRightClickPan: false,
        }}
        onInit={() => {
          if (didInitCenter.current) return
          didInitCenter.current = true
          requestAnimationFrame(() => resetView())
        }}
        onTransform={onTransform}
      >
        <TransformComponent
          wrapperClass="!absolute !inset-0 !z-0 !h-full !w-full bg-neutral-100 dark:bg-neutral-950 [--dot:var(--color-neutral-300)] dark:[--dot:var(--color-neutral-600)]"
          wrapperStyle={{
            backgroundImage:
              "radial-gradient(circle, var(--dot) 1px, transparent 1px)",
            backgroundSize: `${GRID_DOT_FALLBACK}px ${GRID_DOT_FALLBACK}px`,
            backgroundPosition: "0px 0px",
            cursor,
          }}
        >
          <div
            ref={setSurfaceRef}
            className="relative"
            style={{
              width: BOARD_SIZE,
              height: BOARD_SIZE,
              cursor,
            }}
            onPointerDown={onBoardPointerDown}
            onPointerMove={onBoardPointerMove}
            onPointerUp={onBoardPointerUp}
            onPointerCancel={onBoardPointerUp}
            onDoubleClick={onBoardDoubleClick}
          >
            {elements.map((el) => (
              <ElementView
                key={el.id}
                el={el}
                doc={doc}
                selected={selectedSet.has(el.id)}
                canEdit={canEdit}
                renderers={elementRenderers}
                showPorts={
                  !editingLabelId &&
                  (tool === "connector" || selectedSet.has(el.id))
                }
                passThrough={passThroughElements}
                editingLabelId={editingLabelId}
                shapeLabelLabels={shapeLabelLabels}
                onStartLabelEdit={onStartLabelEdit}
                onEndLabelEdit={onEndLabelEdit}
                onSelect={onSelectElement}
                onTextChange={onTextChange}
                onPointerDownElement={onPointerDownElement}
                onPortPointerDown={onPortPointerDown}
                onResizePointerDown={onResizePointerDown}
              />
            ))}

            {Object.entries(overlays).map(([key, node]) => (
              <div key={key} data-wb-overlay={key}>
                {node}
              </div>
            ))}

            {sortedPlugins.map((plugin) => {
              const node = plugin.renderOverlay?.(featureCtx)
              if (!node) return null
              return (
                <div
                  key={plugin.id}
                  className="pointer-events-none absolute inset-0"
                  data-wb-plugin-overlay={plugin.id}
                >
                  {node}
                </div>
              )
            })}

            {boardOverlay}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {sortedPlugins.map((plugin) => {
        const node = plugin.renderChrome?.(featureCtx)
        if (!node) return null
        return (
          <div key={`chrome-${plugin.id}`} data-wb-plugin-chrome={plugin.id}>
            {node}
          </div>
        )
      })}
    </div>
  )
}

