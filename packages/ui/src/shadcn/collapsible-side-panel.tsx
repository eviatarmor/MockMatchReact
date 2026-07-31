import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
} from "react"

import { cn } from "../lib/utils"

/**
 * Shared open/close timing (CSS transition, not Motion).
 * Keep Monaco/xterm layout debounce roughly in the same ballpark.
 */
export const SIDE_PANEL_MS = 320
export const SIDE_PANEL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

export type CollapsibleSidePanelSide = "left" | "right"
export type CollapsibleSidePanelMode = "overlay" | "push"

export type CollapsibleSidePanelProps = {
  open: boolean
  /** Pixel width when open (also fixed inner width so content doesn't reflow mid-anim). */
  width: number
  side?: CollapsibleSidePanelSide
  /**
   * - `overlay` — `transform: translateX` over siblings (GPU; no flex thrash)
   * - `push` — CSS `width` transition (real layout push; pair with debounced editor layout)
   */
  mode?: CollapsibleSidePanelMode
  /**
   * Transition duration in ms. Defaults to {@link SIDE_PANEL_MS}.
   * Implemented as inline `transitionDuration` (not a Tailwind duration class)
   * so hosts can tune without regenerating utilities.
   */
  durationMs?: number
  children: ReactNode
  className?: string
  /** Applied to the fixed-width inner shell. */
  innerClassName?: string
  style?: CSSProperties
  /** data-slot for tests / styling */
  slot?: string
}

/**
 * Enter/exit presence for overlay panels (mount off-screen, then slide in).
 */
function useOverlayPresence(open: boolean) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setEntered(false)
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setEntered(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }
    setEntered(false)
  }, [open])

  const onTransitionEnd = (e: TransitionEvent<HTMLElement>) => {
    if (e.propertyName !== "transform") return
    if (!open) setMounted(false)
  }

  return { mounted, entered, onTransitionEnd }
}

/**
 * Smooth collapsible side panel.
 *
 * Overlay mode is preferred for AI/ask/rails (compositor transform).
 * Push mode for classic IDE file trees — use with trailing-debounced Monaco layout.
 */
export function CollapsibleSidePanel({
  open,
  width,
  side = "right",
  mode = "overlay",
  durationMs = SIDE_PANEL_MS,
  children,
  className,
  innerClassName,
  style,
  slot = "collapsible-side-panel",
}: CollapsibleSidePanelProps) {
  const overlay = useOverlayPresence(open)
  const transitionStyle: CSSProperties = {
    transitionDuration: `${durationMs}ms`,
    transitionTimingFunction: SIDE_PANEL_EASE,
  }

  if (mode === "push") {
    return (
      <aside
        className={cn(
          "relative h-full shrink-0 overflow-hidden",
          // Tailwind only enables the property; duration/easing are inline (see durationMs).
          "transition-[width] motion-reduce:transition-none",
          !open && "pointer-events-none",
          className
        )}
        style={{
          width: open ? width : 0,
          ...transitionStyle,
          ...style,
        }}
        data-slot={slot}
        data-mode="push"
        data-open={open || undefined}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-col",
            innerClassName
          )}
          style={{ width }}
        >
          {children}
        </div>
      </aside>
    )
  }

  // overlay
  if (!overlay.mounted) return null

  return (
    <aside
      className={cn(
        "absolute inset-y-0 z-20 flex min-h-0 flex-col overflow-hidden",
        "shadow-xl will-change-transform",
        "transition-transform motion-reduce:transition-none",
        side === "right" ? "right-0" : "left-0",
        overlay.entered
          ? "translate-x-0"
          : side === "right"
            ? "translate-x-full"
            : "-translate-x-full",
        className
      )}
      style={{
        width,
        ...transitionStyle,
        ...style,
      }}
      data-slot={slot}
      data-mode="overlay"
      data-open={open || undefined}
      data-side={side}
      aria-hidden={!open}
      onTransitionEnd={overlay.onTransitionEnd}
    >
      <div
        className={cn("flex h-full min-h-0 w-full flex-col", innerClassName)}
      >
        {children}
      </div>
    </aside>
  )
}
