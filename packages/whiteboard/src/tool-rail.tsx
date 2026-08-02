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
} from "lucide-react"
import { Button } from "@mockmatch/ui/button"
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

type SecondaryRail = "draw" | "shape" | "sticky" | null

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

function SecondaryShell({
  ariaLabel,
  children,
}: {
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur"
      role="toolbar"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

/**
 * Primary tool rail + secondary rails (Miro-style).
 * - Draw: pen / highlighter / smart / erasers / lasso + stroke style
 * - Shape: shape kind picker
 * - Sticky: note color presets
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
  const initialRail = (): SecondaryRail => {
    if (isDrawTool(tool)) return "draw"
    if (tool === "shape") return "shape"
    if (tool === "sticky") return "sticky"
    return null
  }
  const [secondary, setSecondary] = useState<SecondaryRail>(initialRail)

  const drawActive = isDrawTool(tool)
  const showDrawRail = secondary === "draw" || drawActive
  const showShapeRail = secondary === "shape" || tool === "shape"
  const showStickyRail = secondary === "sticky" || tool === "sticky"

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
    setSecondary("draw")
    onToolChange(next)
  }

  const openShape = (kind?: ShapeKind) => {
    setSecondary("shape")
    if (kind) onShapeKindChange(kind)
    onToolChange("shape")
  }

  const openSticky = () => {
    setSecondary("sticky")
    onToolChange("sticky")
  }

  const onPrimary = (id: WhiteboardTool | "draw") => {
    if (id === "draw") {
      openDraw(isDrawTool(tool) ? (tool as DrawTool) : "pen")
      return
    }
    if (id === "shape") {
      openShape()
      return
    }
    if (id === "sticky") {
      openSticky()
      return
    }
    setSecondary(null)
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
                ? drawActive || secondary === "draw"
                : id === "shape"
                  ? tool === "shape" || secondary === "shape"
                  : id === "sticky"
                    ? tool === "sticky" || secondary === "sticky"
                    : tool === id

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
        </div>

        {/* Secondary draw rail */}
        {showDrawRail ? (
          <SecondaryShell ariaLabel={labels.draw}>
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
          </SecondaryShell>
        ) : null}

        {/* Secondary shape rail — same chrome as draw */}
        {showShapeRail && !showDrawRail ? (
          <SecondaryShell ariaLabel={labels.shapesTitle}>
            {SHAPE_MENU_ITEMS.map((item) => {
              const SIcon = SHAPE_ICONS[item.kind]
              const selected = shapeKind === item.kind
              const label = labels.resolveShapeLabel(item.labelKey)
              return (
                <RailButton
                  key={item.kind}
                  active={selected && tool === "shape"}
                  disabled={disabled}
                  label={label}
                  hotkey={item.hotkey || undefined}
                  onClick={() => openShape(item.kind)}
                >
                  <SIcon className="size-4" />
                </RailButton>
              )
            })}
          </SecondaryShell>
        ) : null}

        {/* Secondary sticky color rail */}
        {showStickyRail && !showDrawRail && !showShapeRail ? (
          <SecondaryShell ariaLabel={labels.stickyColor}>
            <div
              className="flex flex-col items-center gap-1.5 px-0.5 py-0.5"
              role="listbox"
              aria-label={labels.stickyColor}
            >
              {STICKY_COLOR_PRESETS.map((color) => {
                const active =
                  stickyColor.toLowerCase() === color.toLowerCase()
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    aria-selected={active}
                    disabled={disabled}
                    onClick={() => {
                      onStickyColorChange(color)
                      openSticky()
                    }}
                    className={cn(
                      "size-6 rounded-sm border border-black/10 shadow-sm",
                      active && "ring-2 ring-blue-500 ring-offset-1"
                    )}
                    style={{ backgroundColor: color }}
                  />
                )
              })}
            </div>
          </SecondaryShell>
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
