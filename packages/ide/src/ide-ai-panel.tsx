import type { ReactNode } from "react"
import {
  CollapsibleSidePanel,
} from "@mockmatch/ui/collapsible-side-panel"
import { SidePanelResizeHandle } from "@mockmatch/ui/side-panel-resize-handle"
import { cn } from "@mockmatch/ui/utils"

import type { ResolvedColorScheme } from "./use-color-scheme"
import { useRightPanelWidth } from "./use-right-panel-width"

export type IdeAiPanelProps = {
  open: boolean
  children: ReactNode
  /**
   * Matches editor/terminal scheme so surface tokens + Streamdown/Shiki
   * follow IDE theme (not only the host app shell).
   */
  colorScheme?: ResolvedColorScheme
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  widthStorageKey?: string
  resizeLabel?: string
  className?: string
}

/**
 * Right-side AI chrome — **overlay + translateX** so Monaco is not reflowed
 * every animation frame. Parent row must be `relative`.
 */
export function IdeAiPanel({
  open,
  children,
  colorScheme = "dark",
  defaultWidth = 360,
  minWidth = 280,
  maxWidth = 560,
  widthStorageKey = "mockmatch.ide.ai-width",
  resizeLabel = "Resize AI panel",
  className,
}: IdeAiPanelProps) {
  const { width, startResize } = useRightPanelWidth({
    defaultWidth,
    min: minWidth,
    max: maxWidth,
    storageKey: widthStorageKey,
  })

  return (
    <CollapsibleSidePanel
      open={open}
      width={width}
      side="right"
      mode="overlay"
      slot="ide-ai-panel"
      className={cn(
        "border-l border-border bg-background text-foreground",
        colorScheme === "dark" ? "dark" : "light",
        className
      )}
    >
      <div
        className="relative flex h-full min-h-0 flex-col"
        data-color-scheme={colorScheme}
      >
        <SidePanelResizeHandle
          onPointerDown={startResize}
          label={resizeLabel}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </CollapsibleSidePanel>
  )
}
