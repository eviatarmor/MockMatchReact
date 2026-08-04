import { MousePointer2 } from "lucide-react"
import type { WhiteboardPlugin } from "../../plugin-system"
import { selectTool } from "./select-tool"

export function createSelectPlugin(): WhiteboardPlugin {
  return {
    id: "select",
    order: 10,
    rail: {
      order: 10,
      primary: {
        id: "select",
        icon: MousePointer2,
        hotkey: "V",
        resolveLabel: (labels) => labels.select,
        isActive: (api) => api.tool === "select",
        onClick: (api) => {
          api.setSecondary(null)
          api.setTool("select")
        },
      },
    },
    tools: [selectTool],
  }
}

/** @deprecated Use createSelectPlugin */
export const createSelectToolPlugin = createSelectPlugin
