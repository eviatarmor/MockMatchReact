import {
  renderDefaultElement,
} from "../../canvas/elements"
import type { WhiteboardPlugin } from "../../plugin-system"

/**
 * Registers built-in element type renderers
 * (sticky, text, shape, stencil, path, connector).
 * Without this plugin the canvas has no visual for elements unless another
 * plugin supplies `elements`.
 */
export function createElementsPlugin(): WhiteboardPlugin {
  return {
    id: "elements",
    order: 1,
    elements: [
      { type: "sticky", render: renderDefaultElement },
      { type: "text", render: renderDefaultElement },
      { type: "shape", render: renderDefaultElement },
      { type: "stencil", render: renderDefaultElement },
      { type: "path", render: renderDefaultElement },
      { type: "connector", render: renderDefaultElement },
    ],
  }
}
