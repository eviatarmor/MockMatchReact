import {
  CircleDot,
  Eraser,
  Highlighter,
  Lasso,
  Pencil,
  Sparkles,
} from "lucide-react"
import {
  DRAW_COLOR_PRESETS,
  isDrawTool,
  isStrokeDrawTool,
  type DrawTool,
} from "../../types"
import type { ToolRailApi, WhiteboardPlugin } from "../../plugin-system"
import { ColorSwatch, RailButton } from "../rail-ui"
import { DRAW_INTERACTION_TOOLS } from "./stroke-tools"

const DRAW_SUBTOOLS: readonly {
  id: DrawTool
  icon: typeof Pencil
  hotkey: string
  labelKey: "pen" | "highlighter" | "smart" | "eraser" | "precisionEraser" | "lasso"
}[] = [
  { id: "pen", icon: Pencil, hotkey: "P", labelKey: "pen" },
  { id: "highlighter", icon: Highlighter, hotkey: "M", labelKey: "highlighter" },
  { id: "smart", icon: Sparkles, hotkey: "G", labelKey: "smart" },
  { id: "eraser", icon: Eraser, hotkey: "E", labelKey: "eraser" },
  {
    id: "precisionEraser",
    icon: CircleDot,
    hotkey: "Shift+E",
    labelKey: "precisionEraser",
  },
  { id: "lasso", icon: Lasso, hotkey: "O", labelKey: "lasso" },
]

function openDraw(api: ToolRailApi, next: DrawTool = "pen") {
  api.setSecondary("draw")
  api.setTool(next)
}

function DrawSecondary({ api }: { api: ToolRailApi }) {
  const activeStrokeStyle =
    api.tool === "highlighter"
      ? api.highlighterStyle
      : api.tool === "smart"
        ? api.smartStyle
        : api.penStyle
  const setActiveStrokeStyle =
    api.tool === "highlighter"
      ? api.setHighlighterStyle
      : api.tool === "smart"
        ? api.setSmartStyle
        : api.setPenStyle

  return (
    <>
      {DRAW_SUBTOOLS.map(({ id, icon: Icon, hotkey, labelKey }) => (
        <RailButton
          key={id}
          active={api.tool === id}
          disabled={api.disabled}
          label={api.labels[labelKey]}
          hotkey={hotkey}
          onClick={() => openDraw(api, id)}
        >
          <Icon className="size-4" />
        </RailButton>
      ))}

      {isStrokeDrawTool(api.tool) ? (
        <>
          <div className="my-1 border-t border-border" />
          <div
            className="flex flex-col items-center gap-1.5 px-0.5"
            role="listbox"
            aria-label={api.drawStyleLabels.color}
          >
            {DRAW_COLOR_PRESETS.slice(0, 5).map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                active={
                  activeStrokeStyle.color.toLowerCase() === color.toLowerCase()
                }
                onClick={() =>
                  setActiveStrokeStyle({ ...activeStrokeStyle, color })
                }
              />
            ))}
          </div>
          <div
            className="flex flex-col items-center gap-1.5 pb-0.5"
            role="listbox"
            aria-label={api.drawStyleLabels.thickness}
          >
            {(api.tool === "highlighter" ? [8, 16, 24] : [2, 6, 12]).map(
              (width) => {
                const active = activeStrokeStyle.width === width
                return (
                  <button
                    key={width}
                    type="button"
                    aria-label={`${api.drawStyleLabels.thickness} ${width}`}
                    aria-selected={active}
                    onClick={() =>
                      setActiveStrokeStyle({ ...activeStrokeStyle, width })
                    }
                    className={
                      active
                        ? "flex size-6 items-center justify-center rounded-full border border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "flex size-6 items-center justify-center rounded-full border border-border"
                    }
                  >
                    <span
                      className="rounded-full bg-foreground"
                      style={{
                        width: Math.min(14, 3 + width / 2),
                        height: Math.min(14, 3 + width / 2),
                      }}
                    />
                  </button>
                )
              }
            )}
          </div>
        </>
      ) : null}
    </>
  )
}

/** Draw plugin: rail + pen/highlighter/smart/eraser/lasso interaction. */
export function createDrawPlugin(): WhiteboardPlugin {
  return {
    id: "draw",
    order: 30,
    rail: {
      order: 30,
      primary: {
        id: "draw",
        icon: Pencil,
        hotkey: "P",
        resolveLabel: (labels) => labels.draw,
        isActive: (api) =>
          isDrawTool(api.tool) || api.secondary === "draw",
        onClick: (api) => {
          openDraw(api, isDrawTool(api.tool) ? (api.tool as DrawTool) : "pen")
        },
      },
      secondary: {
        group: "draw",
        resolveAriaLabel: (labels) => labels.draw,
        isOpen: (api) => api.secondary === "draw" || isDrawTool(api.tool),
        render: (api) => <DrawSecondary api={api} />,
      },
    },
    tools: DRAW_INTERACTION_TOOLS,
  }
}

export const createDrawToolPlugin = createDrawPlugin
