import {
  createPath,
  createShape,
  maxZ,
  lassoSelectIds,
  newElementId,
} from "../../document"
import {
  eraseWholeStrokesAt,
  precisionEraseAt,
} from "../../lib/erase"
import { classifySmartStroke } from "../../lib/geometry"
import type { DrawStrokeStyle } from "../../types"
import type {
  BoardPointer,
  InteractionHost,
  ToolDefinition,
  ToolGesture,
} from "../../core/interaction-types"

type StrokeGesture = ToolGesture & {
  type: "stroke"
  mode: "pen" | "highlighter" | "smart"
  points: { x: number; y: number }[]
  color: string
  width: number
  opacity: number
}

type EraserGesture = ToolGesture & {
  type: "eraser"
  precision: boolean
}

type LassoGesture = ToolGesture & {
  type: "lasso"
  points: { x: number; y: number }[]
}

function strokeStyle(
  host: InteractionHost,
  mode: "pen" | "highlighter" | "smart"
): DrawStrokeStyle {
  if (mode === "highlighter") {
    return host.getOption<DrawStrokeStyle>("highlighterStyle", {
      color: "#facc15",
      width: 16,
    })
  }
  if (mode === "smart") {
    return host.getOption<DrawStrokeStyle>("smartStyle", {
      color: "#171717",
      width: 2,
    })
  }
  return host.getOption<DrawStrokeStyle>("penStyle", {
    color: "#171717",
    width: 2,
  })
}

function draftPathOverlay(g: StrokeGesture) {
  if (g.points.length < 2) return null
  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ width: 1, height: 1 }}
    >
      <path
        d={g.points
          .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
          .join(" ")}
        fill="none"
        stroke={g.color}
        strokeWidth={g.width}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={g.opacity}
        style={{
          mixBlendMode: g.mode === "highlighter" ? "multiply" : "normal",
        }}
      />
    </svg>
  )
}

function lassoOverlay(points: { x: number; y: number }[]) {
  if (points.length < 2) return null
  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ width: 1, height: 1 }}
    >
      <polygon
        points={points.map((pt) => `${pt.x},${pt.y}`).join(" ")}
        fill="rgba(59,130,246,0.12)"
        stroke="#3b82f6"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
    </svg>
  )
}

function startStroke(
  mode: "pen" | "highlighter" | "smart",
  p: BoardPointer,
  host: InteractionHost
): StrokeGesture {
  const style = strokeStyle(host, mode)
  const opacity = mode === "highlighter" ? 0.35 : 1
  const g: StrokeGesture = {
    type: "stroke",
    mode,
    points: [{ x: p.boardX, y: p.boardY }],
    color: style.color,
    width: style.width,
    opacity,
  }
  host.setOverlay("draft-path", draftPathOverlay(g))
  return g
}

function applyEraser(
  host: InteractionHost,
  x: number,
  y: number,
  precision: boolean
) {
  const current = host.getDocument()
  const eraserRadius = host.getOption("eraserRadius", 14)
  const precisionRadius = host.getOption("precisionEraserRadius", 6)
  if (precision) {
    const next = precisionEraseAt(
      current,
      { x, y },
      precisionRadius,
      newElementId
    )
    const curIds = Object.keys(current.elements)
    const nextIds = Object.keys(next.elements)
    const unchanged =
      curIds.length === nextIds.length &&
      curIds.every((id) => current.elements[id] === next.elements[id])
    if (!unchanged) host.dispatch({ type: "setDocument", document: next })
  } else {
    const { next, removedIds } = eraseWholeStrokesAt(
      current,
      { x, y },
      eraserRadius
    )
    if (removedIds.length > 0) {
      host.dispatch({ type: "setDocument", document: next })
    }
  }
}

function commitStroke(g: StrokeGesture, host: InteractionHost) {
  if (g.points.length < 2 || !host.canEdit()) return

  if (g.mode === "smart") {
    const classified = classifySmartStroke(g.points)
    const style = strokeStyle(host, "smart")
    if (classified.kind === "line" && classified.points?.length === 2) {
      const [a, b] = classified.points
      const el = createPath({
        points: [a!, b!],
        stroke: style.color,
        strokeWidth: style.width,
        strokeKind: "smart",
        z: maxZ(host.getDocument()) + 1,
      })
      host.dispatch({ type: "upsert", element: el })
      host.setSelectedIds([el.id])
      return
    }
    for (const kind of ["rect", "ellipse", "triangle"] as const) {
      if (classified.kind === kind && classified.bounds) {
        const b = classified.bounds
        const el = createShape({
          x: b.x,
          y: b.y,
          w: b.w,
          h: b.h,
          shape: kind,
          stroke: style.color,
          fill: "transparent",
          z: maxZ(host.getDocument()) + 1,
        })
        host.dispatch({ type: "upsert", element: el })
        host.setSelectedIds([el.id])
        return
      }
    }
    const pts = classified.points ?? g.points
    if (pts.length >= 2) {
      const el = createPath({
        points: pts,
        stroke: style.color,
        strokeWidth: style.width,
        strokeKind: "smart",
        z: maxZ(host.getDocument()) + 1,
      })
      host.dispatch({ type: "upsert", element: el })
      host.setSelectedIds([el.id])
    }
    return
  }

  const el = createPath({
    points: g.points,
    stroke: g.color,
    strokeWidth: g.width,
    strokeKind: g.mode,
    opacity: g.opacity,
    z: maxZ(host.getDocument()) + 1,
  })
  host.dispatch({ type: "upsert", element: el })
  host.setSelectedIds([el.id])
}

function makeStrokeTool(
  id: "pen" | "highlighter" | "smart"
): ToolDefinition {
  return {
    id,
    cursor: "crosshair",
    passThroughElements: true,
    onPointerDown(p, host) {
      if (p.button !== 0 || !host.canEdit()) return null
      p.stopPropagation()
      return startStroke(id, p, host)
    },
    onPointerMove(p, gesture, host) {
      if (gesture.type !== "stroke") return gesture
      const g = gesture as StrokeGesture
      const last = g.points[g.points.length - 1]
      if (last && Math.hypot(last.x - p.boardX, last.y - p.boardY) < 2) {
        return g
      }
      const next: StrokeGesture = {
        ...g,
        points: [...g.points, { x: p.boardX, y: p.boardY }],
      }
      host.setOverlay("draft-path", draftPathOverlay(next))
      return next
    },
    onPointerUp(_p, gesture, host) {
      host.setOverlay("draft-path", null)
      if (gesture.type === "stroke") commitStroke(gesture as StrokeGesture, host)
    },
  }
}

function makeEraserTool(
  id: "eraser" | "precisionEraser"
): ToolDefinition {
  const precision = id === "precisionEraser"
  return {
    id,
    cursor: "cell",
    passThroughElements: true,
    onPointerDown(p, host) {
      if (p.button !== 0 || !host.canEdit()) return null
      p.stopPropagation()
      applyEraser(host, p.boardX, p.boardY, precision)
      return { type: "eraser", precision } satisfies EraserGesture
    },
    onPointerMove(p, gesture, host) {
      if (gesture.type !== "eraser") return gesture
      applyEraser(host, p.boardX, p.boardY, (gesture as EraserGesture).precision)
      return gesture
    },
    onPointerUp() {
      /* no-op */
    },
  }
}

export const penTool = makeStrokeTool("pen")
export const highlighterTool = makeStrokeTool("highlighter")
export const smartTool = makeStrokeTool("smart")
export const eraserTool = makeEraserTool("eraser")
export const precisionEraserTool = makeEraserTool("precisionEraser")

export const lassoTool: ToolDefinition = {
  id: "lasso",
  cursor: "crosshair",
  passThroughElements: true,
  onPointerDown(p, host) {
    if (p.button !== 0) return null
    p.stopPropagation()
    const points = [{ x: p.boardX, y: p.boardY }]
    host.setOverlay("lasso", lassoOverlay(points))
    return { type: "lasso", points } satisfies LassoGesture
  },
  onPointerMove(p, gesture, host) {
    if (gesture.type !== "lasso") return gesture
    const g = gesture as LassoGesture
    const points = [...g.points, { x: p.boardX, y: p.boardY }]
    host.setOverlay("lasso", lassoOverlay(points))
    return { ...g, points }
  },
  onPointerUp(_p, gesture, host) {
    host.setOverlay("lasso", null)
    if (gesture.type !== "lasso") return
    const g = gesture as LassoGesture
    host.setSelectedIds(lassoSelectIds(host.getDocument(), g.points))
  },
}

export const DRAW_INTERACTION_TOOLS: readonly ToolDefinition[] = [
  penTool,
  highlighterTool,
  smartTool,
  eraserTool,
  precisionEraserTool,
  lassoTool,
]
