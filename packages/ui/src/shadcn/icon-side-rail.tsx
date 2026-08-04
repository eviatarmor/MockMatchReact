"use client"

import {
  useRef,
  useState,
  type ReactNode,
} from "react"
import { PanelRightClose, type LucideIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { useSidePanelWidth } from "../hooks/use-side-panel-width"
import { Button } from "./button"
import { CollapsibleSidePanel } from "./collapsible-side-panel"
import { SidePanelResizeHandle } from "./side-panel-resize-handle"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

const DEFAULT_WIDTH = 320
const DEFAULT_MIN = 280
const DEFAULT_MAX = 720

export type IconSideRailItem<Id extends string = string> = {
  readonly id: Id
  readonly icon: LucideIcon
  readonly label: string
  readonly title: string
  readonly description?: string
  /**
   * When true, panel body is a flex column without the default scroll shell
   * (e.g. chat / AI panels that manage their own overflow).
   */
  readonly fill?: boolean
}

export type IconSideRailProps<Id extends string = string> = {
  readonly items: readonly IconSideRailItem<Id>[]
  /** Main surface (editor, grid, canvas). */
  readonly children: ReactNode
  /** Render body for the open panel id. */
  readonly renderPanel: (id: Id) => ReactNode
  /** Controlled open panel; `null` = collapsed. */
  readonly activeId?: Id | null
  readonly defaultActiveId?: Id | null
  readonly onActiveIdChange?: (id: Id | null) => void
  readonly collapseLabel: string
  readonly resizeLabel: string
  readonly storageKey?: string
  readonly defaultWidth?: number
  readonly minWidth?: number
  readonly maxWidth?: number
  readonly side?: "left" | "right"
  readonly mode?: "overlay" | "push"
  readonly slot?: string
  readonly className?: string
  readonly railClassName?: string
}

/**
 * Product-agnostic right (or left) icon rail + collapsible side panel.
 * Host supplies items (labels already translated) and panel bodies.
 *
 * Used by resume editor, whiteboard, spreadsheet, and available to IDE hosts.
 */
export function IconSideRail<Id extends string = string>({
  items,
  children,
  renderPanel,
  activeId: activeIdProp,
  defaultActiveId,
  onActiveIdChange,
  collapseLabel,
  resizeLabel,
  storageKey,
  defaultWidth = DEFAULT_WIDTH,
  minWidth = DEFAULT_MIN,
  maxWidth = DEFAULT_MAX,
  side = "right",
  mode = "overlay",
  slot = "icon-side-rail-panel",
  className,
  railClassName,
}: IconSideRailProps<Id>) {
  const [uncontrolled, setUncontrolled] = useState<Id | null>(
    () => defaultActiveId ?? items[0]?.id ?? null
  )
  const controlled = activeIdProp !== undefined
  const activeId = controlled ? (activeIdProp as Id | null) : uncontrolled

  const setActiveId = (next: Id | null) => {
    if (!controlled) setUncontrolled(next)
    onActiveIdChange?.(next)
  }

  const { width: panelWidth, startResize } = useSidePanelWidth({
    defaultWidth,
    min: minWidth,
    max: maxWidth,
    storageKey,
  })

  const toggle = (id: Id) =>
    setActiveId(activeId === id ? null : id)

  const lastPanelRef = useRef(activeId)
  if (activeId) lastPanelRef.current = activeId
  const displayId = activeId ?? lastPanelRef.current
  const panelOpen = activeId != null
  const displayItem = displayId
    ? items.find((i) => i.id === displayId)
    : undefined

  if (items.length === 0) {
    return (
      <div className={cn("flex h-full min-h-0 w-full", className)}>
        {children}
      </div>
    )
  }

  const borderSide =
    side === "right" ? "border-l border-border/60" : "border-r border-border/60"
  const tooltipSide = side === "right" ? "left" : "right"

  return (
    <TooltipProvider delay={300}>
      <div
        className={cn(
          "relative z-10 flex h-full min-h-0 w-full overflow-hidden",
          className
        )}
        data-slot="icon-side-rail"
      >
        {side === "left" ? (
          <RailNav
            items={items}
            activeId={activeId}
            onToggle={toggle}
            tooltipSide={tooltipSide}
            className={cn(borderSide, railClassName)}
          />
        ) : null}

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}

          <CollapsibleSidePanel
            open={panelOpen}
            width={panelWidth}
            side={side}
            mode={mode}
            slot={slot}
            className={cn(
              borderSide,
              "bg-background text-foreground"
            )}
          >
            {displayItem && displayId ? (
              <div className="flex h-full min-h-0 flex-col">
                <SidePanelResizeHandle
                  onPointerDown={startResize}
                  label={resizeLabel}
                />

                <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/60 px-4 pb-4 pt-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">
                      {displayItem.title}
                    </h2>
                    {displayItem.description ? (
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {displayItem.description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 cursor-pointer text-muted-foreground"
                    onClick={() => setActiveId(null)}
                    aria-label={collapseLabel}
                  >
                    <PanelRightClose className="size-4" />
                  </Button>
                </div>

                {displayItem.fill ? (
                  <div
                    data-slot="icon-side-rail-panel-body"
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    {renderPanel(displayId)}
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                    {/* key remounts panel content so StaggerItem entrances re-run */}
                    <div
                      key={displayId}
                      data-slot="icon-side-rail-panel-body"
                      className="px-4 py-4"
                    >
                      {renderPanel(displayId)}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CollapsibleSidePanel>
        </div>

        {side === "right" ? (
          <RailNav
            items={items}
            activeId={activeId}
            onToggle={toggle}
            tooltipSide={tooltipSide}
            className={cn(borderSide, railClassName)}
          />
        ) : null}
      </div>
    </TooltipProvider>
  )
}

function RailNav<Id extends string>({
  items,
  activeId,
  onToggle,
  tooltipSide,
  className,
}: {
  items: readonly IconSideRailItem<Id>[]
  activeId: Id | null
  onToggle: (id: Id) => void
  tooltipSide: "left" | "right"
  className?: string
}) {
  return (
    <nav
      className={cn(
        "flex w-12 shrink-0 flex-col items-center gap-1 bg-background py-3 text-foreground",
        className
      )}
      data-slot="icon-side-rail-nav"
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeId === item.id
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  aria-pressed={isActive}
                  aria-label={item.label}
                  className={cn(
                    "flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted"
                  )}
                />
              }
            >
              <Icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent side={tooltipSide}>{item.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
