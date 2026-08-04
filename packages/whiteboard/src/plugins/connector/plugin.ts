import { MoveRight } from "lucide-react"
import type { WhiteboardPlugin } from "../../plugin-system"
import { connectorTool } from "./connector-tool"

export function createConnectorPlugin(): WhiteboardPlugin {
  return {
    id: "connector",
    order: 70,
    rail: {
      order: 70,
      primary: {
        id: "connector",
        icon: MoveRight,
        hotkey: "C",
        resolveLabel: (labels) => labels.connector,
        isActive: (api) => api.tool === "connector",
        onClick: (api) => {
          api.setSecondary(null)
          api.setTool("connector")
        },
      },
    },
    tools: [connectorTool],
  }
}

export const createConnectorToolPlugin = createConnectorPlugin
