import { StickyNote } from "lucide-react"
import { STICKY_COLOR_PRESETS } from "../../types"
import type { ToolRailApi, WhiteboardPlugin } from "../../plugin-system"
import { ColorSwatch } from "../rail-ui"
import { stickyTool } from "./sticky-tool"

function openSticky(api: ToolRailApi) {
  api.setSecondary("sticky")
  api.setTool("sticky")
}

function StickySecondary({ api }: { api: ToolRailApi }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-0.5 py-0.5"
      role="listbox"
      aria-label={api.labels.stickyColor}
    >
      {STICKY_COLOR_PRESETS.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          rounded="sm"
          active={api.stickyColor.toLowerCase() === color.toLowerCase()}
          disabled={api.disabled}
          onClick={() => {
            api.setStickyColor(color)
            openSticky(api)
          }}
        />
      ))}
    </div>
  )
}

export function createStickyPlugin(): WhiteboardPlugin {
  return {
    id: "sticky",
    order: 50,
    rail: {
      order: 50,
      primary: {
        id: "sticky",
        icon: StickyNote,
        hotkey: "N",
        resolveLabel: (labels) => labels.sticky,
        isActive: (api) => api.tool === "sticky" || api.secondary === "sticky",
        onClick: (api) => openSticky(api),
      },
      secondary: {
        group: "sticky",
        resolveAriaLabel: (labels) => labels.stickyColor,
        isOpen: (api) => api.secondary === "sticky" || api.tool === "sticky",
        render: (api) => <StickySecondary api={api} />,
      },
    },
    tools: [stickyTool],
  }
}

export const createStickyToolPlugin = createStickyPlugin
