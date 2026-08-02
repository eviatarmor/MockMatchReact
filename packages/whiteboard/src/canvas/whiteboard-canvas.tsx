import { useCallback, useEffect, useRef, useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import {
  createConnector,
  createPath,
  createShape,
  createSticky,
  createText,
  hitTest,
  lassoSelectIds,
  listElementsSorted,
  maxZ,
  newElementId,
} from "../document"
import {
  eraseWholeStrokesAt,
  precisionEraseAt,
} from "../lib/erase"
import { classifySmartStroke } from "../lib/geometry"
import {
  applyResize,
  closestPort,
  elementPorts,
  snapToGrid,
  type ResizeHandle,
} from "../lib/flowchart"
import { WHITEBOARD_ZOOM, type WhiteboardViewport } from "../viewport"
import type {
  ConnectorAnchor,
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
const SHAPE_MIN_SIZE = 24
const SHAPE_CLICK_DEFAULT = { w: 140, h: 80 } as const

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
  /** Whole-stroke eraser radius (board px). */
  readonly eraserRadius?: number
  /** Precision eraser radius (board px). */
  readonly precisionEraserRadius?: number
  /** Labels for in-shape rich text (bold / italic / …). */
  readonly shapeLabelLabels?: ShapeLabelEditorLabels
}

type DragState =
  | {
      kind: "move"
      ids: string[]
      lastX: number
      lastY: number
      accDx: number
      accDy: number
    }
  | {
      kind: "stroke"
      mode: "pen" | "highlighter" | "smart"
      points: { x: number; y: number }[]
    }
  | {
      kind: "eraser"
      precision: boolean
    }
  | {
      kind: "lasso"
      points: { x: number; y: number }[]
    }
  | {
      kind: "connector"
      fromId: string | null
      fromAnchor: ConnectorAnchor | null
      fromX: number
      fromY: number
    }
  | {
      kind: "resize"
      id: string
      handle: ResizeHandle
      start: { x: number; y: number; w: number; h: number }
    }
  | {
      kind: "createShape"
      shape: ShapeKind
      originX: number
      originY: number
      x: number
      y: number
      w: number
      h: number
    }
  | null

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
  eraserRadius = 14,
  precisionEraserRadius = 6,
  shapeLabelLabels,
}: WhiteboardCanvasProps) {
  const { ref, scale, onTransform, bindGridLayer, resetView } = viewport
  const surfaceRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState>(null)
  const docRef = useRef(doc)
  docRef.current = doc

  const [draftPath, setDraftPath] = useState<
    { x: number; y: number; color?: string; width?: number; opacity?: number }[] | null
  >(null)
  const [draftMeta, setDraftMeta] = useState<{
    color: string
    width: number
    opacity: number
    highlighter?: boolean
  } | null>(null)
  const [lassoPoints, setLassoPoints] = useState<
    { x: number; y: number }[] | null
  >(null)
  const [draftLine, setDraftLine] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
  } | null>(null)
  const [draftShape, setDraftShape] = useState<{
    shape: ShapeKind
    x: number
    y: number
    w: number
    h: number
  } | null>(null)
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const didInitCenter = useRef(false)

  const clearSelection = useCallback(() => {
    onSelectedIdsChange([])
    setEditingLabelId(null)
  }, [onSelectedIdsChange])

  const clientToBoard = useCallback(
    (clientX: number, clientY: number) => {
      const surface = surfaceRef.current
      if (!surface) return { x: 0, y: 0 }
      const rect = surface.getBoundingClientRect()
      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
      }
    },
    [scale]
  )

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

  /**
   * Capture on the board surface + window listeners so move/up stay wired even when
   * the gesture started on a port/shape (child capture used to swallow events).
   */
  const captureBoard = (e: React.PointerEvent) => {
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

  const startStroke = (
    mode: "pen" | "highlighter" | "smart",
    x: number,
    y: number,
    e: React.PointerEvent
  ) => {
    const style =
      mode === "highlighter"
        ? highlighterStyle
        : mode === "smart"
          ? smartStyle
          : penStyle
    const opacity = mode === "highlighter" ? 0.35 : 1
    // Draft-only until pointerup → one undo step, no double-draw vs ElementView
    dragRef.current = {
      kind: "stroke",
      mode,
      points: [{ x, y }],
    }
    setDraftPath([{ x, y }])
    setDraftMeta({
      color: style.color,
      width: style.width,
      opacity,
      highlighter: mode === "highlighter",
    })
    captureBoard(e)
  }

  /** Stroke / eraser / lasso draw through existing elements (they stopPropagation otherwise). */
  const passThroughElements =
    tool === "pen" ||
    tool === "highlighter" ||
    tool === "smart" ||
    tool === "eraser" ||
    tool === "precisionEraser" ||
    tool === "lasso"

  const onBoardPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if (tool === "pan") return
    if (!canEdit && tool !== "select" && tool !== "lasso") return
    if (e.buttons === 4) return

    const { x, y } = clientToBoard(e.clientX, e.clientY)

    if (tool === "select") {
      const hit = hitTest(docRef.current, x, y)
      if (hit) {
        e.stopPropagation()
        // Keep lasso multi-select when dragging a member of the set
        const ids =
          selectedIds.includes(hit) && selectedIds.length > 1
            ? [...selectedIds]
            : [hit]
        onSelectedIdsChange(ids)
        if (editingLabelId && !ids.includes(editingLabelId)) {
          setEditingLabelId(null)
        }
        dragRef.current = {
          kind: "move",
          ids,
          lastX: x,
          lastY: y,
          accDx: 0,
          accDy: 0,
        }
        captureBoard(e)
      } else {
        // Click empty board → deselect
        clearSelection()
      }
      return
    }

    if (!canEdit && tool !== "lasso") return
    e.stopPropagation()

    if (tool === "lasso") {
      dragRef.current = { kind: "lasso", points: [{ x, y }] }
      setLassoPoints([{ x, y }])
      captureBoard(e)
      return
    }

    if (tool === "eraser" || tool === "precisionEraser") {
      dragRef.current = {
        kind: "eraser",
        precision: tool === "precisionEraser",
      }
      applyEraser(x, y, tool === "precisionEraser")
      captureBoard(e)
      return
    }

    if (tool === "pen") {
      startStroke("pen", x, y, e)
      return
    }
    if (tool === "highlighter") {
      startStroke("highlighter", x, y, e)
      return
    }
    if (tool === "smart") {
      startStroke("smart", x, y, e)
      return
    }

    if (tool === "sticky") {
      const el = createSticky({
        x: x - 80,
        y: y - 70,
        color: stickyColor,
        z: maxZ(docRef.current) + 1,
      })
      onCommand({ type: "upsert", element: el })
      onSelectedIdsChange([el.id])
      return
    }

    if (tool === "text") {
      const el = createText({ x, y, z: maxZ(docRef.current) + 1 })
      onCommand({ type: "upsert", element: el })
      onSelectedIdsChange([el.id])
      return
    }

    if (tool === "shape") {
      // Drag-to-size placeholder (like Figma / draw.io)
      setEditingLabelId(null)
      onSelectedIdsChange([])
      dragRef.current = {
        kind: "createShape",
        shape: shapeKind,
        originX: x,
        originY: y,
        x,
        y,
        w: 0,
        h: 0,
      }
      setDraftShape({ shape: shapeKind, x, y, w: 0, h: 0 })
      captureBoard(e)
      return
    }

    if (tool === "connector") {
      const hit = hitTest(docRef.current, x, y)
      const hitEl = hit ? docRef.current.elements[hit] : null
      // Prefer real N/S/E/W ports; fall back to nearest side of the box
      const port = hitEl ? closestPort(hitEl, x, y) : null
      dragRef.current = {
        kind: "connector",
        fromId: hit,
        fromAnchor: port?.anchor ?? (hit ? "c" : null),
        fromX: port?.x ?? x,
        fromY: port?.y ?? y,
      }
      setDraftLine({
        x1: port?.x ?? x,
        y1: port?.y ?? y,
        x2: x,
        y2: y,
      })
      captureBoard(e)
    }
  }

  const applyEraser = (x: number, y: number, precision: boolean) => {
    const current = docRef.current
    if (precision) {
      const next = precisionEraseAt(
        current,
        { x, y },
        precisionEraserRadius,
        newElementId
      )
      // Skip no-op (same element refs) so history/save are not spammed
      const curIds = Object.keys(current.elements)
      const nextIds = Object.keys(next.elements)
      const unchanged =
        curIds.length === nextIds.length &&
        curIds.every((id) => current.elements[id] === next.elements[id])
      if (!unchanged) {
        onCommand({ type: "setDocument", document: next })
      }
    } else {
      const { next, removedIds } = eraseWholeStrokesAt(
        current,
        { x, y },
        eraserRadius
      )
      if (removedIds.length > 0) {
        onCommand({ type: "setDocument", document: next })
      }
    }
  }

  const onBoardPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = clientToBoard(e.clientX, e.clientY)

    if (drag.kind === "move" && canEdit) {
      const dx = x - drag.lastX
      const dy = y - drag.lastY
      if (dx !== 0 || dy !== 0) {
        // Accumulate and apply grid-snapped deltas for architecture layout
        const accDx = drag.accDx + dx
        const accDy = drag.accDy + dy
        const snapDx = snapToGrid(accDx) - snapToGrid(drag.accDx)
        const snapDy = snapToGrid(accDy) - snapToGrid(drag.accDy)
        if (snapDx !== 0 || snapDy !== 0) {
          onCommand({ type: "move", ids: drag.ids, dx: snapDx, dy: snapDy })
        }
        dragRef.current = {
          ...drag,
          lastX: x,
          lastY: y,
          accDx,
          accDy,
        }
      }
      return
    }

    if (drag.kind === "resize" && canEdit) {
      const next = applyResize(drag.start, drag.handle, x, y)
      onCommand({
        type: "patch",
        id: drag.id,
        patch: next as Partial<import("../types").WhiteboardElement>,
      })
      return
    }

    if (drag.kind === "stroke") {
      const last = drag.points[drag.points.length - 1]
      if (last && Math.hypot(last.x - x, last.y - y) < 2) return
      const nextPts = [...drag.points, { x, y }]
      dragRef.current = { ...drag, points: nextPts }
      setDraftPath(nextPts)
      return
    }

    if (drag.kind === "eraser") {
      applyEraser(x, y, drag.precision)
      return
    }

    if (drag.kind === "lasso") {
      const nextPts = [...drag.points, { x, y }]
      dragRef.current = { ...drag, points: nextPts }
      setLassoPoints(nextPts)
      return
    }

    if (drag.kind === "connector") {
      setDraftLine({
        x1: drag.fromX,
        y1: drag.fromY,
        x2: x,
        y2: y,
      })
      return
    }

    if (drag.kind === "createShape") {
      const x0 = Math.min(drag.originX, x)
      const y0 = Math.min(drag.originY, y)
      const w = Math.abs(x - drag.originX)
      const h = Math.abs(y - drag.originY)
      dragRef.current = { ...drag, x: x0, y: y0, w, h }
      setDraftShape({ shape: drag.shape, x: x0, y: y0, w, h })
    }
  }

  const commitCreateShape = (
    drag: Extract<DragState, { kind: "createShape" }>
  ) => {
    const isLineLike =
      drag.shape === "line" ||
      drag.shape === "arrow" ||
      drag.shape === "elbowArrow" ||
      drag.shape === "divider"
    const travel = Math.hypot(drag.w, drag.h)
    let x = drag.x
    let y = drag.y
    let w = drag.w
    let h = drag.h

    // Click without drag → default size centered on origin
    if (travel < 6) {
      if (isLineLike) {
        w = 160
        h = drag.shape === "elbowArrow" ? 80 : 24
      } else if (drag.shape === "blockArrow") {
        w = 160
        h = 72
      } else {
        w = SHAPE_CLICK_DEFAULT.w
        h = SHAPE_CLICK_DEFAULT.h
      }
      x = drag.originX - w / 2
      y = drag.originY - h / 2
    } else {
      // Enforce minimums after drag
      if (isLineLike) {
        w = Math.max(w, 40)
        h = Math.max(h, drag.shape === "elbowArrow" ? 40 : 16)
      } else {
        w = Math.max(w, SHAPE_MIN_SIZE)
        h = Math.max(h, SHAPE_MIN_SIZE)
      }
    }

    const el = createShape({
      x,
      y,
      w,
      h,
      shape: drag.shape,
      fill: isLineLike ? "transparent" : "#ffffff",
      stroke: "#525252",
      z: maxZ(docRef.current) + 1,
    })
    onCommand({ type: "upsert", element: el })
    onSelectedIdsChange([el.id])
  }

  const onBoardPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current
    dragRef.current = null
    setDraftPath(null)
    setDraftMeta(null)
    setLassoPoints(null)
    setDraftLine(null)
    setDraftShape(null)

    if (!drag) return

    if (drag.kind === "createShape" && canEdit) {
      const { x, y } = clientToBoard(e.clientX, e.clientY)
      const x0 = Math.min(drag.originX, x)
      const y0 = Math.min(drag.originY, y)
      const w = Math.abs(x - drag.originX)
      const h = Math.abs(y - drag.originY)
      commitCreateShape({
        ...drag,
        x: x0,
        y: y0,
        w,
        h,
      })
      return
    }

    if (drag.kind === "stroke" && canEdit) {
      if (drag.points.length < 2) return

      if (drag.mode === "smart") {
        const classified = classifySmartStroke(drag.points)
        const style = smartStyle

        if (classified.kind === "line" && classified.points?.length === 2) {
          const [a, b] = classified.points
          const el = createPath({
            points: [a!, b!],
            stroke: style.color,
            strokeWidth: style.width,
            strokeKind: "smart",
            z: maxZ(docRef.current) + 1,
          })
          onCommand({ type: "upsert", element: el })
          onSelectedIdsChange([el.id])
          return
        }
        if (classified.kind === "rect" && classified.bounds) {
          const b = classified.bounds
          const el = createShape({
            x: b.x,
            y: b.y,
            w: b.w,
            h: b.h,
            shape: "rect",
            stroke: style.color,
            fill: "transparent",
            z: maxZ(docRef.current) + 1,
          })
          onCommand({ type: "upsert", element: el })
          onSelectedIdsChange([el.id])
          return
        }
        if (classified.kind === "ellipse" && classified.bounds) {
          const b = classified.bounds
          const el = createShape({
            x: b.x,
            y: b.y,
            w: b.w,
            h: b.h,
            shape: "ellipse",
            stroke: style.color,
            fill: "transparent",
            z: maxZ(docRef.current) + 1,
          })
          onCommand({ type: "upsert", element: el })
          onSelectedIdsChange([el.id])
          return
        }
        if (classified.kind === "triangle" && classified.bounds) {
          const b = classified.bounds
          const el = createShape({
            x: b.x,
            y: b.y,
            w: b.w,
            h: b.h,
            shape: "triangle",
            stroke: style.color,
            fill: "transparent",
            z: maxZ(docRef.current) + 1,
          })
          onCommand({ type: "upsert", element: el })
          onSelectedIdsChange([el.id])
          return
        }
        // free: simplified path residue
        const pts = classified.points ?? drag.points
        if (pts.length >= 2) {
          const el = createPath({
            points: pts,
            stroke: style.color,
            strokeWidth: style.width,
            strokeKind: "smart",
            z: maxZ(docRef.current) + 1,
          })
          onCommand({ type: "upsert", element: el })
          onSelectedIdsChange([el.id])
        }
        return
      }

      // pen / highlighter — single commit
      const style =
        drag.mode === "highlighter" ? highlighterStyle : penStyle
      const opacity = drag.mode === "highlighter" ? 0.35 : 1
      const el = createPath({
        points: drag.points,
        stroke: style.color,
        strokeWidth: style.width,
        strokeKind: drag.mode,
        opacity,
        z: maxZ(docRef.current) + 1,
      })
      onCommand({ type: "upsert", element: el })
      onSelectedIdsChange([el.id])
      return
    }

    if (drag.kind === "lasso") {
      const ids = lassoSelectIds(docRef.current, drag.points)
      onSelectedIdsChange(ids)
      return
    }

    if (drag.kind !== "connector" || !canEdit) return

    const { x, y } = clientToBoard(e.clientX, e.clientY)
    const toHit = hitTest(docRef.current, x, y)
    // Don't self-link when the release lands on the same node
    const sameAsFrom = Boolean(drag.fromId && toHit === drag.fromId)
    const toEl =
      toHit && !sameAsFrom ? docRef.current.elements[toHit] : null
    const toPort = toEl ? closestPort(toEl, x, y) : null
    const from =
      drag.fromId && docRef.current.elements[drag.fromId]
        ? {
            kind: "element" as const,
            elementId: drag.fromId,
            anchor: (drag.fromAnchor ?? "c") as ConnectorAnchor,
          }
        : { kind: "point" as const, x: drag.fromX, y: drag.fromY }
    const to =
      toEl && toHit
        ? {
            kind: "element" as const,
            elementId: toHit,
            anchor: (toPort?.anchor ?? "c") as ConnectorAnchor,
          }
        : { kind: "point" as const, x, y }

    const travel = Math.hypot(x - drag.fromX, y - drag.fromY)
    if (travel < 8) return
    if (
      from.kind === "point" &&
      to.kind === "point" &&
      Math.hypot(from.x - to.x, from.y - to.y) < 8
    ) {
      return
    }
    // Same element both ends with no real attach → skip
    if (
      from.kind === "element" &&
      to.kind === "element" &&
      from.elementId === to.elementId
    ) {
      return
    }

    const el = createConnector({
      from,
      to,
      routing: "elbow",
      z: maxZ(docRef.current) + 1,
    })
    onCommand({ type: "upsert", element: el })
    onSelectedIdsChange([el.id])
  }

  const elements = listElementsSorted(doc)
  const isPanTool = tool === "pan"
  const cursor =
    isPanTool
      ? "grab"
      : tool === "eraser" || tool === "precisionEraser"
        ? "cell"
        : tool === "lasso"
          ? "crosshair"
          : tool === "pen" || tool === "highlighter" || tool === "smart"
            ? "crosshair"
            : tool === "select"
              ? "default"
              : "cell"

  return (
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
        // Empty activationKeys = always allow (non-empty REQUIRES those keys held).
        // Left-drag pans only with Pan tool; middle-click pans in any tool.
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
          ref={surfaceRef}
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
        >
          {elements.map((el) => (
            <ElementView
              key={el.id}
              el={el}
              doc={doc}
              selected={selectedIds.includes(el.id)}
              canEdit={canEdit}
              showPorts={
                !editingLabelId &&
                (tool === "connector" || selectedIds.includes(el.id))
              }
              passThrough={passThroughElements}
              editingLabelId={editingLabelId}
              shapeLabelLabels={shapeLabelLabels}
              onStartLabelEdit={(id) => {
                setEditingLabelId(id)
                onSelectedIdsChange([id])
              }}
              onEndLabelEdit={() => setEditingLabelId(null)}
              onSelect={(id) => {
                onSelectedIdsChange([id])
                if (editingLabelId && editingLabelId !== id) {
                  setEditingLabelId(null)
                }
              }}
              onTextChange={(id, text) => {
                if (!canEdit) return
                const existing = doc.elements[id]
                if (!existing) return
                if (existing.type === "sticky" || existing.type === "text") {
                  onCommand({
                    type: "patch",
                    id,
                    patch: { text } as Partial<typeof existing>,
                  })
                } else if (existing.type === "shape") {
                  onCommand({
                    type: "patch",
                    id,
                    patch: { label: text } as Partial<typeof existing>,
                  })
                }
              }}
              onPointerDownElement={(id, ev) => {
                if (tool === "pan") return
                if (passThroughElements) return
                if (editingLabelId === id) return
                if (tool === "connector" && canEdit) {
                  // Start connector from this node — capture on board, not the shape
                  ev.stopPropagation()
                  ev.preventDefault()
                  const { x, y } = clientToBoard(ev.clientX, ev.clientY)
                  const hitEl = docRef.current.elements[id]
                  const port = hitEl ? closestPort(hitEl, x, y) : null
                  dragRef.current = {
                    kind: "connector",
                    fromId: id,
                    fromAnchor: port?.anchor ?? "c",
                    fromX: port?.x ?? x,
                    fromY: port?.y ?? y,
                  }
                  setDraftLine({
                    x1: port?.x ?? x,
                    y1: port?.y ?? y,
                    x2: x,
                    y2: y,
                  })
                  captureBoard(ev)
                  return
                }
                if (tool !== "select" || !canEdit) return
                ev.stopPropagation()
                const { x, y } = clientToBoard(ev.clientX, ev.clientY)
                dragRef.current = {
                  kind: "move",
                  ids: selectedIds.includes(id) ? [...selectedIds] : [id],
                  lastX: x,
                  lastY: y,
                  accDx: 0,
                  accDy: 0,
                }
                if (!selectedIds.includes(id)) onSelectedIdsChange([id])
                captureBoard(ev)
              }}
              onPortPointerDown={(elementId, anchor, ev) => {
                if (!canEdit) return
                ev.stopPropagation()
                ev.preventDefault()
                const hitEl = docRef.current.elements[elementId]
                const port = hitEl
                  ? elementPorts(hitEl)?.find((p) => p.anchor === anchor)
                  : null
                const p = port ?? { x: 0, y: 0, anchor }
                dragRef.current = {
                  kind: "connector",
                  fromId: elementId,
                  fromAnchor: anchor,
                  fromX: p.x,
                  fromY: p.y,
                }
                setDraftLine({ x1: p.x, y1: p.y, x2: p.x, y2: p.y })
                // Capture on board so move/up fire on board handlers
                captureBoard(ev)
              }}
              onResizePointerDown={(elementId, handle, ev) => {
                if (!canEdit) return
                ev.stopPropagation()
                const hitEl = docRef.current.elements[elementId]
                if (
                  !hitEl ||
                  hitEl.type === "path" ||
                  hitEl.type === "connector"
                )
                  return
                dragRef.current = {
                  kind: "resize",
                  id: elementId,
                  handle,
                  start: {
                    x: hitEl.x,
                    y: hitEl.y,
                    w: hitEl.w,
                    h: hitEl.h,
                  },
                }
                captureBoard(ev)
              }}
            />
          ))}

          {draftPath && draftPath.length > 1 && draftMeta ? (
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              style={{ width: 1, height: 1 }}
            >
              <path
                d={draftPath
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                  .join(" ")}
                fill="none"
                stroke={draftMeta.color}
                strokeWidth={draftMeta.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={draftMeta.opacity}
                style={{
                  mixBlendMode: draftMeta.highlighter ? "multiply" : "normal",
                }}
              />
            </svg>
          ) : null}

          {lassoPoints && lassoPoints.length > 1 ? (
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              style={{ width: 1, height: 1 }}
            >
              <polygon
                points={lassoPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="rgba(59,130,246,0.12)"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            </svg>
          ) : null}

          {draftLine ? (
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              style={{ width: 1, height: 1 }}
            >
              <line
                x1={draftLine.x1}
                y1={draftLine.y1}
                x2={draftLine.x2}
                y2={draftLine.y2}
                stroke="#60a5fa"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            </svg>
          ) : null}

          {draftShape && draftShape.w + draftShape.h > 0 ? (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-blue-400 bg-blue-400/10"
              style={{
                left: draftShape.x,
                top: draftShape.y,
                width: Math.max(1, draftShape.w),
                height: Math.max(1, draftShape.h),
                borderRadius:
                  draftShape.shape === "ellipse"
                    ? "50%"
                    : draftShape.shape === "rect"
                      ? 6
                      : 0,
              }}
            />
          ) : null}
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}
