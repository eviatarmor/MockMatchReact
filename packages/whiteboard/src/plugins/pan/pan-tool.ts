import type { ToolDefinition } from "../../core/interaction-types"

/**
 * Pan is handled by the viewport TransformWrapper (left-drag pan).
 * This tool exists so the registry is complete and cursor is correct.
 */
export const panTool: ToolDefinition = {
  id: "pan",
  cursor: "grab",
  onPointerDown() {
    // Viewport owns pan; ignore board gestures.
    return null
  },
}
