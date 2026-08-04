import {
  ArrowRight,
  Circle,
  Diamond,
  Minus,
  MoveRight,
  Pentagon,
  Square,
  Triangle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  DRAW_COLOR_PRESETS,
  SHAPE_MENU_ITEMS,
  type ShapeKind,
} from "../../types"
import type { ToolRailApi, WhiteboardPlugin } from "../../plugin-system"
import { ColorSwatch, RailButton } from "../rail-ui"
import { shapeTool } from "./shape-tool"

const SHAPE_ICONS: Record<ShapeKind, LucideIcon> = {
  line: Minus,
  arrow: ArrowRight,
  elbowArrow: MoveRight,
  blockArrow: Pentagon,
  rect: Square,
  ellipse: Circle,
  diamond: Diamond,
  triangle: Triangle,
  divider: Minus,
}

function openShape(api: ToolRailApi, kind?: ShapeKind) {
  api.setSecondary("shape")
  if (kind) api.setShapeKind(kind)
  api.setTool("shape")
}

function ShapeSecondary({ api }: { api: ToolRailApi }) {
  return (
    <>
      {SHAPE_MENU_ITEMS.map((item) => {
        const SIcon = SHAPE_ICONS[item.kind]
        const selected = api.shapeKind === item.kind
        const label = api.labels.resolveShapeLabel(item.labelKey)
        return (
          <RailButton
            key={item.kind}
            active={selected && api.tool === "shape"}
            disabled={api.disabled}
            label={label}
            hotkey={item.hotkey || undefined}
            onClick={() => openShape(api, item.kind)}
          >
            <SIcon className="size-4" />
          </RailButton>
        )
      })}
      <div className="my-1 border-t border-border" />
      <div
        className="flex flex-col items-center gap-1.5 px-0.5 pb-0.5"
        role="listbox"
        aria-label={api.drawStyleLabels.color}
      >
        {DRAW_COLOR_PRESETS.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            active={api.shapeColor.toLowerCase() === color.toLowerCase()}
            disabled={api.disabled}
            onClick={() => {
              api.setShapeColor(color)
              openShape(api)
            }}
          />
        ))}
      </div>
    </>
  )
}

export function createShapePlugin(): WhiteboardPlugin {
  return {
    id: "shape",
    order: 40,
    rail: {
      order: 40,
      primary: {
        id: "shape",
        icon: Square,
        hotkey: "R",
        resolveLabel: (labels) => labels.shape,
        isActive: (api) => api.tool === "shape" || api.secondary === "shape",
        onClick: (api) => openShape(api),
      },
      secondary: {
        group: "shape",
        resolveAriaLabel: (labels) => labels.shapesTitle,
        isOpen: (api) => api.secondary === "shape" || api.tool === "shape",
        render: (api) => <ShapeSecondary api={api} />,
      },
    },
    tools: [shapeTool],
  }
}

export const createShapeToolPlugin = createShapePlugin
