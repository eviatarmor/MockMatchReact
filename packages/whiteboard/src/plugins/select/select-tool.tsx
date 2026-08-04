import { marqueeSelectIds } from "../../document"
import { snapToGrid } from "../../lib/flowchart"
import type {
  ToolDefinition,
  ToolGesture,
} from "../../core/interaction-types"

type MoveGesture = ToolGesture & {
  type: "move"
  ids: string[]
  lastX: number
  lastY: number
  accDx: number
  accDy: number
}

type MarqueeGesture = ToolGesture & {
  type: "marquee"
  originX: number
  originY: number
  x: number
  y: number
  w: number
  h: number
}

/**
 * Select tool: hit → move (or double-activate via features);
 * empty → marquee multi-select.
 */
export const selectTool: ToolDefinition = {
  id: "select",
  cursor: "default",
  onPointerDown(p, host) {
    if (p.button !== 0) return null
    const { boardX: x, boardY: y } = p
    const hit = host.hitTestAt(x, y)

    if (hit) {
      p.stopPropagation()
      if (p.detail >= 2 && host.canEdit()) {
        if (host.runSelectDoubleActivate(hit, x, y)) return null
      }
      const selected = host.getSelectedIds()
      const ids =
        selected.includes(hit) && selected.length > 1 ? [...selected] : [hit]
      host.setSelectedIds(ids)
      const editing = host.getEditingId()
      if (editing && !ids.includes(editing)) host.setEditingId(null)

      const ae = document.activeElement
      if (
        ae instanceof HTMLElement &&
        (ae.tagName === "TEXTAREA" ||
          ae.tagName === "INPUT" ||
          ae.isContentEditable) &&
        !ids.includes(
          ae.closest("[data-el-id]")?.getAttribute("data-el-id") ?? ""
        )
      ) {
        ae.blur()
      }

      if (!host.canEdit()) return null
      return {
        type: "move",
        ids,
        lastX: x,
        lastY: y,
        accDx: 0,
        accDy: 0,
      } satisfies MoveGesture
    }

    // Empty board: clear selection immediately (Figma/Miro), then marquee if drag.
    // Deselect must not wait for pointerup — lost ups left multi-select stuck.
    if (p.detail >= 2) return null
    host.setEditingId(null)
    host.setSelectedIds([])
    const g: MarqueeGesture = {
      type: "marquee",
      originX: x,
      originY: y,
      x,
      y,
      w: 0,
      h: 0,
    }
    host.setOverlay("marquee", marqueeNode(g))
    return g
  },
  onPointerMove(p, gesture, host) {
    if (gesture.type === "move" && host.canEdit()) {
      const g = gesture as MoveGesture
      const dx = p.boardX - g.lastX
      const dy = p.boardY - g.lastY
      if (dx === 0 && dy === 0) return g
      const accDx = g.accDx + dx
      const accDy = g.accDy + dy
      const snapDx = snapToGrid(accDx) - snapToGrid(g.accDx)
      const snapDy = snapToGrid(accDy) - snapToGrid(g.accDy)
      if (snapDx !== 0 || snapDy !== 0) {
        host.dispatch({ type: "move", ids: g.ids, dx: snapDx, dy: snapDy })
      }
      return {
        ...g,
        lastX: p.boardX,
        lastY: p.boardY,
        accDx,
        accDy,
      }
    }
    if (gesture.type === "marquee") {
      const g = gesture as MarqueeGesture
      const x0 = Math.min(g.originX, p.boardX)
      const y0 = Math.min(g.originY, p.boardY)
      const w = Math.abs(p.boardX - g.originX)
      const h = Math.abs(p.boardY - g.originY)
      const next: MarqueeGesture = { ...g, x: x0, y: y0, w, h }
      host.setOverlay("marquee", marqueeNode(next))
      // Only re-select after a real drag (selection was cleared on pointerdown)
      if (Math.hypot(w, h) >= 6) {
        host.setSelectedIds(
          marqueeSelectIds(host.getDocument(), { x: x0, y: y0, w, h })
        )
      }
      return next
    }
    return gesture
  },
  onPointerUp(p, gesture, host) {
    host.setOverlay("marquee", null)
    if (gesture.type !== "marquee") return
    const g = gesture as MarqueeGesture
    const x0 = Math.min(g.originX, p.boardX)
    const y0 = Math.min(g.originY, p.boardY)
    const w = Math.abs(p.boardX - g.originX)
    const h = Math.abs(p.boardY - g.originY)
    // Click: already cleared on down. Drag: commit marquee selection.
    if (Math.hypot(w, h) >= 6) {
      host.setSelectedIds(
        marqueeSelectIds(host.getDocument(), { x: x0, y: y0, w, h })
      )
    }
    host.setEditingId(null)
  },
}

function marqueeNode(g: MarqueeGesture) {
  if (g.w + g.h <= 0) return null
  return (
    <div
      className="pointer-events-none absolute border border-dashed border-blue-500 bg-blue-500/10"
      style={{
        left: g.x,
        top: g.y,
        width: Math.max(1, g.w),
        height: Math.max(1, g.h),
      }}
    />
  )
}
