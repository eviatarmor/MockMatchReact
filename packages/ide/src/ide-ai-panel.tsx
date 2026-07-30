import type { ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { SidePanelResizeHandle } from "@mockmatch/ui/side-panel-resize-handle"
import { cn } from "@mockmatch/ui/utils"

import type { ResolvedColorScheme } from "./use-color-scheme"
import { useRightPanelWidth } from "./use-right-panel-width"

const PANEL_SPRING = { type: "spring" as const, stiffness: 320, damping: 34 }

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
 * Right-side AI / assistant chrome for the IDE shell.
 * Host supplies chat content as `children` (e.g. `@mockmatch/ai-chat` surface).
 *
 * Scopes light/dark CSS variables on the panel root so injected chat UI
 * (and code fences) track the IDE theme, including when the editor theme
 * differs from the app shell.
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
  const { width, startResize, isDragging } = useRightPanelWidth({
    defaultWidth,
    min: minWidth,
    max: maxWidth,
    storageKey: widthStorageKey,
  })

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.aside
          key="ide-ai-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={isDragging ? { duration: 0 } : PANEL_SPRING}
          className={cn(
            "relative h-full min-h-0 shrink-0 overflow-hidden border-l border-border bg-background text-foreground",
            colorScheme === "dark" ? "dark" : "light",
            className
          )}
          data-slot="ide-ai-panel"
          data-color-scheme={colorScheme}
        >
          <div
            className="relative flex h-full min-h-0 flex-col"
            style={{ width }}
          >
            <SidePanelResizeHandle
              onPointerDown={startResize}
              label={resizeLabel}
            />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
