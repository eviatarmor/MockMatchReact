import { createText, maxZ } from "../../document"
import type {
  WhiteboardPlugin,
  WhiteboardPluginContext,
} from "../../plugin-system"

function tryStartTextEdit(
  elementId: string,
  ctx: WhiteboardPluginContext
): boolean {
  if (!ctx.canEdit()) return false
  const el = ctx.getDocument().elements[elementId]
  if (!el || el.type !== "text") return false
  ctx.setSelectedIds([elementId])
  ctx.setEditingId(elementId)
  return true
}

/** Free-text: double-click text / empty board. */
export function createTextEditPlugin(): WhiteboardPlugin {
  return {
    id: "text-edit",
    order: 30,
    onDoubleClick(e, ctx) {
      if (ctx.getTool() !== "select") return false
      if (!ctx.canEdit()) return false

      if (e.hitId) {
        const hit = ctx.getDocument().elements[e.hitId]
        if (!hit) return false
        if (hit.type === "text") return tryStartTextEdit(e.hitId, ctx)
        if (hit.type === "sticky") {
          ctx.setSelectedIds([e.hitId])
          return true
        }
        return false
      }

      const el = createText({
        x: e.boardX,
        y: e.boardY,
        text: "",
        z: maxZ(ctx.getDocument()) + 1,
      })
      ctx.dispatch({ type: "upsert", element: el })
      ctx.setSelectedIds([el.id])
      ctx.setEditingId(el.id)
      return true
    },
    onSelectDoubleActivate(e, ctx) {
      return tryStartTextEdit(e.elementId, ctx)
    },
  }
}

export const textEditPlugin = createTextEditPlugin
