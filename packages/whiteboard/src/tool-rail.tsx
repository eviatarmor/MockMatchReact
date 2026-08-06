import { useMemo, useRef, useState } from "react"
import { TooltipProvider } from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"
import type {
  DrawStrokeStyle,
  DrawStyleBarLabels,
  ShapeKind,
  WhiteboardTool,
} from "./types"
import {
  sortRailPlugins,
  type ToolRailApi,
  type WhiteboardPlugin,
} from "./plugin-system"
import type { WhiteboardToolRailLabels } from "./tool-rail-labels"
import { createDefaultPlugins, RailButton, SecondaryShell } from "./plugins"
import { isDrawTool, isViewSafeWhiteboardTool } from "./types"

/** Primary rail button ids that stay usable in view-only sessions. */
const VIEW_SAFE_PRIMARY_IDS = new Set(["select", "pan"])

export type { WhiteboardToolRailLabels } from "./tool-rail-labels"

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
  readonly shapeColor: string
  readonly onShapeColorChange: (color: string) => void
  /** Disables the entire rail (including select/pan). Prefer `canEdit` for view guests. */
  readonly disabled?: boolean
  /**
   * When false, edit tools (draw, sticky, text, shape, connector, …) are disabled
   * and secondary panels are hidden. Select/pan stay available for navigation.
   * Default true.
   */
  readonly canEdit?: boolean
  readonly className?: string
  /**
   * Unified plugins (same list as canvas). Rail uses plugins with `rail`.
   * Default: createDefaultPlugins().
   */
  readonly plugins?: readonly WhiteboardPlugin[]
  /** @deprecated Use `plugins` */
  readonly toolPlugins?: readonly WhiteboardPlugin[]
}

const SECONDARY_PRIORITY = ["draw", "shape", "sticky"] as const

function pickOpenSecondary(
  plugins: readonly WhiteboardPlugin[],
  api: ToolRailApi
): WhiteboardPlugin | null {
  const withRail = plugins.filter((p) => p.rail?.secondary)
  const open = withRail.filter((p) => p.rail!.secondary!.isOpen(api))
  if (open.length === 0) return null
  for (const group of SECONDARY_PRIORITY) {
    const hit = open.find((p) => p.rail!.secondary!.group === group)
    if (hit) return hit
  }
  return open[0] ?? null
}

/**
 * Left tool rail assembled from unified plugins that contribute `rail`.
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
  shapeColor,
  onShapeColorChange,
  disabled,
  canEdit = true,
  className,
  plugins: pluginsProp,
  toolPlugins,
}: WhiteboardToolRailProps) {
  const defaultRef = useRef<WhiteboardPlugin[] | null>(null)
  if (!defaultRef.current) defaultRef.current = createDefaultPlugins()
  const plugins = pluginsProp ?? toolPlugins ?? defaultRef.current
  const sorted = useMemo(() => sortRailPlugins(plugins), [plugins])

  const editLocked = !canEdit
  const railDisabled = Boolean(disabled)

  const initialSecondary = (): string | null => {
    if (editLocked || railDisabled) return null
    if (isDrawTool(tool)) return "draw"
    if (tool === "shape") return "shape"
    if (tool === "sticky") return "sticky"
    return null
  }
  const [secondary, setSecondary] = useState<string | null>(initialSecondary)

  const setToolGuarded = (next: WhiteboardTool) => {
    if (editLocked && !isViewSafeWhiteboardTool(next)) return
    onToolChange(next)
  }

  const api: ToolRailApi = {
    tool,
    setTool: setToolGuarded,
    secondary: editLocked || railDisabled ? null : secondary,
    setSecondary: editLocked || railDisabled ? () => {} : setSecondary,
    labels,
    drawStyleLabels,
    shapeKind,
    setShapeKind: onShapeKindChange,
    penStyle,
    highlighterStyle,
    smartStyle,
    setPenStyle: onPenStyleChange,
    setHighlighterStyle: onHighlighterStyleChange,
    setSmartStyle: onSmartStyleChange,
    stickyColor,
    setStickyColor: onStickyColorChange,
    shapeColor,
    setShapeColor: onShapeColorChange,
    disabled: railDisabled || editLocked,
  }

  const openSecondary =
    editLocked || railDisabled ? null : pickOpenSecondary(sorted, api)

  return (
    <TooltipProvider delay={300}>
      <div className={cn("flex items-start gap-2", className)}>
        <div
          className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur"
          role="toolbar"
          aria-label="Whiteboard tools"
        >
          {sorted.map((plugin) => {
            const primary = plugin.rail?.primary
            if (!primary) return null
            const Icon = primary.icon
            const viewSafe = VIEW_SAFE_PRIMARY_IDS.has(primary.id)
            const btnDisabled =
              railDisabled || (editLocked && !viewSafe)
            return (
              <RailButton
                key={plugin.id}
                active={primary.isActive(api)}
                disabled={btnDisabled}
                label={primary.resolveLabel(labels)}
                hotkey={primary.hotkey}
                onClick={() => {
                  if (btnDisabled) return
                  primary.onClick(api)
                }}
              >
                <Icon className="size-4" />
              </RailButton>
            )
          })}
        </div>

        {openSecondary?.rail?.secondary ? (
          <SecondaryShell
            ariaLabel={openSecondary.rail.secondary.resolveAriaLabel(labels)}
          >
            {openSecondary.rail.secondary.render(api)}
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
