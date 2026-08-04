import { Type } from "lucide-react"
import type { WhiteboardPlugin } from "../../plugin-system"
import { textTool } from "./text-tool"

export function createTextPlugin(): WhiteboardPlugin {
  return {
    id: "text",
    order: 60,
    rail: {
      order: 60,
      primary: {
        id: "text",
        icon: Type,
        hotkey: "T",
        resolveLabel: (labels) => labels.text,
        isActive: (api) => api.tool === "text",
        onClick: (api) => {
          api.setSecondary(null)
          api.setTool("text")
        },
      },
    },
    tools: [textTool],
  }
}

export const createTextToolPlugin = createTextPlugin
