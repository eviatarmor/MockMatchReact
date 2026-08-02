import { useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  Circle,
  CircleDot,
  Diamond,
  Eraser,
  Hand,
  Highlighter,
  Lasso,
  Minus,
  MousePointer2,
  MoveRight,
  Pencil,
  Pentagon,
  Sparkles,
  Square,
  StickyNote,
  Triangle,
  Type,
  ChevronDown,
} from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mockmatch/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { Kbd } from "@mockmatch/ui/kbd"
import { cn } from "@mockmatch/ui/utils"
import {
  DRAW_COLOR_PRESETS,
  DRAW_TOOLS,
  DRAW_WIDTH_PRESETS,
  SHAPE_MENU_ITEMS,
  STICKY_COLOR_PRESETS,
  isDrawTool,
  isStrokeDrawTool,
  type DrawStrokeStyle,
  type DrawStyleBarLabels,
  type DrawTool,
  type ShapeKind,
  type ToolRailLabels,
  type WhiteboardTool,
} from "./types"

const PRIMARY_TOOLS: readonly {
  id: WhiteboardTool | "draw"
  icon: LucideIcon
  hotkey: string
  labelKey: keyof ToolRailLabels | "draw"
}[] = [
  { id: "select", icon: MousePointer2, hotkey: "V", labelKey: "select" },
  { id: "pan", icon: Hand, hotkey: "H", labelKey: "pan" },
  { id: "draw", icon: Pencil, hotkey: "P", labelKey: "draw" },
  { id: "shape", icon: Square, hotkey: "R", labelKey: "shape" },
  { id: "sticky", icon: StickyNote, hotkey: "N", labelKey: "sticky" },
  { id: "text", icon: Type, hotkey: "T", labelKey: "text" },
  { id: "connector", icon: MoveRight, hotkey: "C", labelKey: "connector" },
]

const DRAW_RAIL: readonly {
  id: DrawTool
  icon: LucideIcon
  hotkey: string
  labelKey: keyof ToolRailLabels
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

export type WhiteboardToolRailLabels = ToolRailLabels & {
  readonly draw: string
  readonly shapesTitle: string
  readonly stickyColor: string
  readonly resolveShapeLabel: (key: string) => string
}

export type WhiteboardToolRailProps = {
  readonly tool: WhiteboardTool
  readonly onToolChange: (tool: WhiteboardTool) => void
  readonly labels: WhiteboardToolRailLabels
  readonly drawStyleLabels: DrawStyleBarLabels
  readonly shapeKind: ShapeKind
  readonly onShapeKindChange: (kind: ShapeKind) => void
  readonly penStyle: DrawStrokeStyle
  readonly highlighterStyle: DrawStrokeStyle
  readonly smartStyle: DrawStrokeStyle
  readonly onPenStyleChange: (s: DrawStrokeStyle) => void
  readonly onHighlighterStyleChange: (s: DrawStrokeStyle) => void
  readonly onSmartStyleChange: (s: DrawStrokeStyle) => void
  readonly stickyColor: string
  readonly onStickyColorChange: (color: string) => void
  readonly disabled?: boolean
  readonly className?: string
}

function RailButton({
  active,
  disabled,
  label,
  hotkey,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  label: string
  hotkey?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant={active ? "default" : "ghost"}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className="size-9 shrink-0"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        <span>{label}</span>
        {hotkey ? <Kbd>{hotkey}</Kbd> : null}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Primary tool rail + secondary draw rail (Miro-style).
 * Draw tools (pen / highlighter / smart / erasers / lasso) only appear
 * in the secondary panel when draw mode is active.
 */
export function WhiteboardToolRail({
  tool,
  onToolChange,
  labels,
  drawStyleLabels,
  shapeKind,
  onShapeKindChange,
  penStyle,
  highlighterStyle,
  smartStyle,
  onPenStyleChange,
  onHighlighterStyleChange,
  onSmartStyleChange,
  stickyColor,
  onStickyColorChange,
  disabled,
  className,
}: WhiteboardToolRailProps) {
  const [drawOpen, setDrawOpen] = useState(() => isDrawTool(tool))
  const [shapeOpen, setShapeOpen] = useState(false)

  const drawActive = isDrawTool(tool)
  const showDrawRail = drawOpen || drawActive

  const activeStrokeStyle: DrawStrokeStyle =
    tool === "highlighter"
      ? highlighterStyle
      : tool === "smart"
        ? smartStyle
        : penStyle
  const setActiveStrokeStyle =
    tool === "highlighter"
      ? onHighlighterStyleChange
      : tool === "smart"
        ? onSmartStyleChange
        : onPenStyleChange

  const openDraw = (next: DrawTool = "pen") => {
    setDrawOpen(true)
    onToolChange(next)
  }

  const onPrimary = (id: WhiteboardTool | "draw") => {
    if (id === "draw") {
      openDraw(isDrawTool(tool) ? (tool as DrawTool) : "pen")
      return
    }
    if (id !== "shape") setShapeOpen(false)
    if (!isDrawTool(id)) setDrawOpen(false)
    onToolChange(id)
  }

  return (
    <TooltipProvider delay={300}>
      <div className={cn("flex items-start gap-2", className)}>
        {/* Primary rail */}
        <div
          className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur"
          role="toolbar"
          aria-label="Whiteboard tools"
        >
          {PRIMARY_TOOLS.map(({ id, icon: Icon, hotkey, labelKey }) => {
            const label =
              labelKey === "draw"
                ? labels.draw
                : labels[labelKey as keyof ToolRailLabels]
            const active =
              id === "draw"
                ? drawActive || drawOpen
                : id === "shape"
                  ? tool === "shape"
                  : tool === id

            if (id === "shape") {
              return (
                <Popover
                  key={id}
                  open={shapeOpen}
                  onOpenChange={(o) => {
                    setShapeOpen(o)
                    if (o) {
                      setDrawOpen(false)
                      onToolChange("shape")
                    }
                  }}
                >
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        size="icon"
                        variant={active ? "default" : "ghost"}
                        disabled={disabled}
                        aria-label={label}
                        aria-pressed={active}
                        title={label}
                        className="relative size-9 shrink-0"
                      />
                    }
                  >
                    <Icon className="size-4" />
                    <ChevronDown className="absolute bottom-0.5 right-0.5 size-2.5 opacity-70" />
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-52 gap-0 p-1"
                    sideOffset={10}
                  >
                    <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {labels.shapesTitle}
                    </p>
                    <ul className="flex flex-col">
                      {SHAPE_MENU_ITEMS.map((item) => {
                        const SIcon = SHAPE_ICONS[item.kind]
                        const selected = shapeKind === item.kind
                        return (
                          <li key={item.kind}>
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                                selected
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-muted"
                              )}
                              onClick={() => {
                                onShapeKindChange(item.kind)
                                onToolChange("shape")
                                setShapeOpen(false)
                              }}
                            >
                              <SIcon className="size-4 shrink-0" />
                              <span className="flex-1">
                                {labels.resolveShapeLabel(item.labelKey)}
                              </span>
                              {item.hotkey ? (
                                <Kbd className="ml-auto">{item.hotkey}</Kbd>
                              ) : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </PopoverContent>
                </Popover>
              )
            }

            return (
              <RailButton
                key={id}
                active={active}
                disabled={disabled}
                label={label}
                hotkey={hotkey}
                onClick={() => onPrimary(id)}
              >
                <Icon className="size-4" />
              </RailButton>
            )
          })}

          {/* Sticky color strip under primary when sticky tool active */}
          {tool === "sticky" ? (
            <div
              className="mt-1 flex flex-col items-center gap-1 border-t border-border pt-1.5"
              role="listbox"
              aria-label={labels.stickyColor}
            >
              {STICKY_COLOR_PRESETS.map((color) => {
                const active = stickyColor.toLowerCase() === color.toLowerCase()
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    aria-selected={active}
                    onClick={() => onStickyColorChange(color)}
                    className={cn(
                      "size-5 rounded-sm border border-black/10 shadow-sm",
                      active && "ring-2 ring-blue-500 ring-offset-1"
                    )}
                    style={{ backgroundColor: color }}
                  />
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Secondary draw rail — only when draw mode open */}
        {showDrawRail ? (
          <div
            className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur"
            role="toolbar"
            aria-label={labels.draw}
          >
            {DRAW_RAIL.map(({ id, icon: Icon, hotkey, labelKey }) => (
              <RailButton
                key={id}
                active={tool === id}
                disabled={disabled}
                label={labels[labelKey]}
                hotkey={hotkey}
                onClick={() => openDraw(id)}
              >
                <Icon className="size-4" />
              </RailButton>
            ))}

            {isStrokeDrawTool(tool) ? (
              <>
                <div className="my-1 border-t border-border" />
                <div
                  className="flex flex-col items-center gap-1.5 px-0.5"
                  role="listbox"
                  aria-label={drawStyleLabels.color}
                >
                  {DRAW_COLOR_PRESETS.slice(0, 5).map((color) => {
                    const active =
                      activeStrokeStyle.color.toLowerCase() ===
                      color.toLowerCase()
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-label={color}
                        aria-selected={active}
                        onClick={() =>
                          setActiveStrokeStyle({
                            ...activeStrokeStyle,
                            color,
                          })
                        }
                        className={cn(
                          "size-5 rounded-full border border-black/10",
                          active && "ring-2 ring-blue-500 ring-offset-1",
                          color === "#ffffff" && "border-neutral-300"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    )
                  })}
                </div>
                <div
                  className="flex flex-col items-center gap-1.5 pb-0.5"
                  role="listbox"
                  aria-label={drawStyleLabels.thickness}
                >
                  {(tool === "highlighter"
                    ? [8, 16, 24]
                    : [2, 6, 12]
                  ).map((width) => {
                    const active = activeStrokeStyle.width === width
                    return (
                      <button
                        key={width}
                        type="button"
                        aria-label={`${drawStyleLabels.thickness} ${width}`}
                        aria-selected={active}
                        onClick={() =>
                          setActiveStrokeStyle({
                            ...activeStrokeStyle,
                            width,
                          })
                        }
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full border",
                          active
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                            : "border-border"
                        )}
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
                  })}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  )
}

export function toolFromHotkey(
  key: string,
  opts?: { shiftKey?: boolean }
): WhiteboardTool | null {
  const k = key.toLowerCase()
  if (k === "v" || k === "escape") return "select"
  if (k === "h") return "pan"
  if (k === "p") return "pen"
  if (k === "m") return "highlighter"
  if (k === "g") return "smart"
  if (k === "e") return opts?.shiftKey ? "precisionEraser" : "eraser"
  // O was lasso; shape oval uses O when shape menu — prefer lasso only without shift
  if (k === "o") return "lasso"
  if (k === "n") return "sticky"
  if (k === "t") return "text"
  if (k === "r") return "shape"
  if (k === "c") return "connector"
  return null
}

export function shapeKindFromHotkey(key: string): ShapeKind | null {
  const k = key.toLowerCase()
  if (k === "r") return "rect"
  if (k === "o") return "ellipse"
  if (k === "l") return "line"
  return null
}

// silence unused DRAW_TOOLS import check - used conceptually for isDrawTool
void DRAW_TOOLS
void DRAW_WIDTH_PRESETS
