import type { ReactNode } from "react"
import {
  EDITOR_SECONDARY_BAR_ROW,
  EDITOR_SECONDARY_BAR_SURFACE_STUCK,
} from "@mockmatch/ui/lib/editor-chrome"
import { cn } from "@mockmatch/ui/utils"

export type IdeChromeBarDensity = "page" | "shell"

export type IdeChromeBarProps = {
  /**
   * Leading control (e.g. back icon button). Renders before the title.
   */
  readonly leading?: ReactNode
  /**
   * Session title. Strings/numbers render as a standard `h1`; pass a custom
   * node to override markup or sizing.
   */
  readonly title?: ReactNode
  /**
   * Format / mode chip after the title (host supplies Badge or equivalent).
   */
  readonly badge?: ReactNode
  /**
   * Left cluster after title/badge — typically {@link IdeMenubar} or host menus.
   */
  readonly start?: ReactNode
  /**
   * Flexible middle region (Run controls, description, etc.). Host owns layout
   * inside this slot; the slot itself is `flex-1 min-w-0`.
   */
  readonly center?: ReactNode
  /**
   * Trailing actions (share, save status, presence, etc.).
   */
  readonly end?: ReactNode
  /**
   * - `page` — host practice bars (resume-editor glass, h-11)
   * - `shell` — internal IdeShell menubar row (same glass, slightly tighter gap)
   */
  readonly density?: IdeChromeBarDensity
  readonly className?: string
}

/**
 * Shared workbench top bar for IDE hosts and other practice surfaces
 * (conversation, MCQ, whiteboard). Glass secondary chrome matches resume-editor
 * {@link EditorSecondaryBar}.
 *
 * Layout: `[leading] [title] [badge] [start] [center flex-1] [end]`
 */
export function IdeChromeBar({
  leading,
  title,
  badge,
  start,
  center,
  end,
  density = "page",
  className,
}: IdeChromeBarProps) {
  const titleNode =
    title == null ? null : typeof title === "string" || typeof title === "number" ? (
      <h1 className="min-w-0 shrink truncate text-sm font-medium text-foreground">
        {title}
      </h1>
    ) : (
      title
    )

  const needsSpacer = center == null && end != null

  return (
    <div
      data-slot="ide-chrome-bar"
      data-density={density}
      className={cn(
        EDITOR_SECONDARY_BAR_ROW,
        EDITOR_SECONDARY_BAR_SURFACE_STUCK,
        density === "shell" && "gap-1.5",
        className
      )}
    >
      {leading}
      {titleNode}
      {badge}
      {start}
      {center != null ? (
        <div
          data-slot="ide-chrome-bar-center"
          className="flex min-w-0 flex-1 items-center gap-1.5"
        >
          {center}
        </div>
      ) : needsSpacer ? (
        <div data-slot="ide-chrome-bar-spacer" className="min-w-0 flex-1" />
      ) : null}
      {end != null ? (
        <div
          data-slot="ide-chrome-bar-end"
          className="flex shrink-0 items-center gap-1.5"
        >
          {end}
        </div>
      ) : null}
    </div>
  )
}
