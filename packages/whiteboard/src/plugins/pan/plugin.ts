import { Hand } from "lucide-react"
import type { WhiteboardPlugin } from "../../plugin-system"
import { panTool } from "./pan-tool"

export function createPanPlugin(): WhiteboardPlugin {
  return {
    id: "pan",
    order: 20,
    rail: {
      order: 20,
      primary: {
        id: "pan",
        icon: Hand,
        hotkey: "H",
        resolveLabel: (labels) => labels.pan,
        isActive: (api) => api.tool === "pan",
        onClick: (api) => {
          api.setSecondary(null)
          api.setTool("pan")
        },
      },
    },
    tools: [panTool],
  }
}

export const createPanToolPlugin = createPanPlugin
