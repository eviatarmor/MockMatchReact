import type { ShapeElement } from "../../types"
import type {
  WhiteboardPlugin,
  WhiteboardPluginContext,
} from "../../plugin-system"

function isLineLikeShape(el: ShapeElement): boolean {
  return (
    el.shape === "line" ||
    el.shape === "arrow" ||
    el.shape === "elbowArrow" ||
    el.shape === "divider"
  )
}

function tryStartShapeLabelEdit(
  elementId: string,
  ctx: WhiteboardPluginContext
): boolean {
  if (!ctx.canEdit()) return false
  const el = ctx.getDocument().elements[elementId]
  if (!el || el.type !== "shape") return false
  if (isLineLikeShape(el)) return false
  ctx.setSelectedIds([elementId])
  ctx.setEditingId(elementId)
  return true
}

/** Double-click closed shape → center label edit. */
export function createShapeLabelPlugin(): WhiteboardPlugin {
  return {
    id: "shape-label",
    order: 20,
    onDoubleClick(e, ctx) {
      if (ctx.getTool() !== "select") return false
      if (!e.hitId) return false
      return tryStartShapeLabelEdit(e.hitId, ctx)
    },
    onSelectDoubleActivate(e, ctx) {
      return tryStartShapeLabelEdit(e.elementId, ctx)
    },
  }
}

export const shapeLabelPlugin = createShapeLabelPlugin
