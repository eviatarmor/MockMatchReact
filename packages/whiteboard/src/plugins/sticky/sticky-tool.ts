import { createSticky, maxZ } from "../../document"
import type { ToolDefinition } from "../../core/interaction-types"

export const stickyTool: ToolDefinition = {
  id: "sticky",
  cursor: "cell",
  onPointerDown(p, host) {
    if (p.button !== 0 || !host.canEdit()) return null
    p.stopPropagation()
    const color = host.getOption("stickyColor", "#fef08a")
    const el = createSticky({
      x: p.boardX - 80,
      y: p.boardY - 70,
      color,
      z: maxZ(host.getDocument()) + 1,
    })
    host.dispatch({ type: "upsert", element: el })
    host.setSelectedIds([el.id])
    return null
  },
}
