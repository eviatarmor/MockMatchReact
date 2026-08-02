import { cn } from "@mockmatch/ui/utils"
import {
  DRAW_COLOR_PRESETS,
  DRAW_WIDTH_PRESETS,
  type DrawStrokeStyle,
  type DrawStyleBarLabels,
} from "./types"

export type WhiteboardDrawStyleBarProps = {
  readonly style: DrawStrokeStyle
  readonly onChange: (next: DrawStrokeStyle) => void
  readonly labels: DrawStyleBarLabels
  /** Highlighter uses thicker defaults in the width list. */
  readonly mode?: "pen" | "highlighter" | "smart"
  readonly className?: string
}

/**
 * Compact color + thickness strip for pen / highlighter / smart draw.
 */
export function WhiteboardDrawStyleBar({
  style,
  onChange,
  labels,
  mode = "pen",
  className,
}: WhiteboardDrawStyleBarProps) {
  const widths =
    mode === "highlighter"
      ? DRAW_WIDTH_PRESETS.filter((w) => w >= 8)
      : DRAW_WIDTH_PRESETS.filter((w) => w <= 16)

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card/95 p-2 shadow-md backdrop-blur",
        className
      )}
      role="group"
      aria-label={labels.color}
    >
      <div className="flex flex-wrap gap-1" role="listbox" aria-label={labels.color}>
        {DRAW_COLOR_PRESETS.map((color) => {
          const active = style.color.toLowerCase() === color.toLowerCase()
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-selected={active}
              onClick={() => onChange({ ...style, color })}
              className={cn(
                "size-6 rounded-full border border-black/10 shadow-sm transition-transform",
                active && "ring-2 ring-blue-500 ring-offset-1 scale-110",
                color === "#ffffff" && "border-neutral-300"
              )}
              style={{ backgroundColor: color }}
            />
          )
        })}
      </div>
      <div
        className="flex flex-wrap items-center gap-1"
        role="listbox"
        aria-label={labels.thickness}
      >
        {widths.map((width) => {
          const active = style.width === width
          return (
            <button
              key={width}
              type="button"
              aria-label={`${labels.thickness} ${width}`}
              aria-selected={active}
              onClick={() => onChange({ ...style, width })}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                active
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-border hover:bg-muted"
              )}
            >
              <span
                className="block rounded-full bg-foreground"
                style={{
                  width: Math.min(18, 4 + width),
                  height: Math.min(10, Math.max(2, width / 2)),
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
