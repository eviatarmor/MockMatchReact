import { createText, maxZ } from "../../document"
import type { ToolDefinition } from "../../core/interaction-types"

export const textTool: ToolDefinition = {
  id: "text",
  cursor: "cell",
  onPointerDown(p, host) {
    if (p.button !== 0 || !host.canEdit()) return null
    p.stopPropagation()
    const el = createText({
      x: p.boardX,
      y: p.boardY,
      text: "",
      z: maxZ(host.getDocument()) + 1,
    })
    host.dispatch({ type: "upsert", element: el })
    host.setSelectedIds([el.id])
    host.setEditingId(el.id)
    return null
  },
}
