import { createShape, maxZ } from "../../document"
import type { ShapeKind } from "../../types"
import type {
  InteractionHost,
  ToolDefinition,
  ToolGesture,
} from "../../core/interaction-types"

const SHAPE_MIN_SIZE = 24
const SHAPE_CLICK_DEFAULT = { w: 140, h: 80 } as const

type CreateShapeGesture = ToolGesture & {
  type: "createShape"
  shape: ShapeKind
  originX: number
  originY: number
  x: number
  y: number
  w: number
  h: number
}

function isLineLike(shape: ShapeKind) {
  return (
    shape === "line" ||
    shape === "arrow" ||
    shape === "elbowArrow" ||
    shape === "divider"
  )
}

function draftShapeNode(g: CreateShapeGesture, stroke: string) {
  if (g.w + g.h <= 0) return null
  return (
    <div
      className="pointer-events-none absolute border-2 border-dashed bg-transparent"
      style={{
        left: g.x,
        top: g.y,
        width: Math.max(1, g.w),
        height: Math.max(1, g.h),
        borderColor: stroke,
        borderRadius:
          g.shape === "ellipse" ? "50%" : g.shape === "rect" ? 6 : 0,
      }}
    />
  )
}

function commitShape(g: CreateShapeGesture, host: InteractionHost) {
  const shapeColor = host.getOption("shapeColor", "#171717")
  let x = g.x
  let y = g.y
  let w = g.w
  let h = g.h
  const travel = Math.hypot(w, h)
  const lineLike = isLineLike(g.shape)

  if (travel < 6) {
    if (lineLike) {
      w = 160
      h = g.shape === "elbowArrow" ? 80 : 24
    } else if (g.shape === "blockArrow") {
      w = 160
      h = 72
    } else {
      w = SHAPE_CLICK_DEFAULT.w
      h = SHAPE_CLICK_DEFAULT.h
    }
    x = g.originX - w / 2
    y = g.originY - h / 2
  } else if (lineLike) {
    w = Math.max(w, 40)
    h = Math.max(h, g.shape === "elbowArrow" ? 40 : 16)
  } else {
    w = Math.max(w, SHAPE_MIN_SIZE)
    h = Math.max(h, SHAPE_MIN_SIZE)
  }

  const el = createShape({
    x,
    y,
    w,
    h,
    shape: g.shape,
    fill: lineLike ? "transparent" : "#ffffff",
    stroke: shapeColor,
    z: maxZ(host.getDocument()) + 1,
  })
  host.dispatch({ type: "upsert", element: el })
  host.setSelectedIds([el.id])
}

export const shapeTool: ToolDefinition = {
  id: "shape",
  cursor: "cell",
  onPointerDown(p, host) {
    if (p.button !== 0 || !host.canEdit()) return null
    p.stopPropagation()
    host.setEditingId(null)
    host.setSelectedIds([])
    const shape = host.getOption<ShapeKind>("shapeKind", "rect")
    const g: CreateShapeGesture = {
      type: "createShape",
      shape,
      originX: p.boardX,
      originY: p.boardY,
      x: p.boardX,
      y: p.boardY,
      w: 0,
      h: 0,
    }
    host.setOverlay(
      "draft-shape",
      draftShapeNode(g, host.getOption("shapeColor", "#171717"))
    )
    return g
  },
  onPointerMove(p, gesture, host) {
    if (gesture.type !== "createShape") return gesture
    const g = gesture as CreateShapeGesture
    const x0 = Math.min(g.originX, p.boardX)
    const y0 = Math.min(g.originY, p.boardY)
    const w = Math.abs(p.boardX - g.originX)
    const h = Math.abs(p.boardY - g.originY)
    const next: CreateShapeGesture = { ...g, x: x0, y: y0, w, h }
    host.setOverlay(
      "draft-shape",
      draftShapeNode(next, host.getOption("shapeColor", "#171717"))
    )
    return next
  },
  onPointerUp(p, gesture, host) {
    host.setOverlay("draft-shape", null)
    if (gesture.type !== "createShape" || !host.canEdit()) return
    const g = gesture as CreateShapeGesture
    const x0 = Math.min(g.originX, p.boardX)
    const y0 = Math.min(g.originY, p.boardY)
    const w = Math.abs(p.boardX - g.originX)
    const h = Math.abs(p.boardY - g.originY)
    commitShape({ ...g, x: x0, y: y0, w, h }, host)
  },
}
