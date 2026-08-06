import { cn } from "@mockmatch/ui/utils"
import {
  DEFAULT_HIGHLIGHT_COLORS,
  DEFAULT_TEXT_COLORS,
} from "../constants"

export function ColorSwatchMenu({
  kind,
  noneLabel,
  activeColor,
  onPick,
}: {
  readonly kind: "text" | "highlight"
  readonly noneLabel: string
  readonly activeColor: string | null
  readonly onPick: (color: string | null) => void
}) {
  const colors =
    kind === "text" ? DEFAULT_TEXT_COLORS : DEFAULT_HIGHLIGHT_COLORS

  return (
    <div
      role="listbox"
      className="grid grid-cols-4 gap-1.5 p-1"
      onMouseDown={(e) => e.preventDefault()}
    >
      {colors.map((color) => {
        const isNone = color === "transparent"
        const active =
          isNone
            ? activeColor == null
            : activeColor?.toLowerCase() === color.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            role="option"
            aria-selected={active}
            title={isNone ? noneLabel : color}
            aria-label={isNone ? noneLabel : color}
            className={cn(
              "size-6 rounded-md ring-1 ring-black/10 transition-transform hover:scale-110 dark:ring-white/15",
              active && "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-neutral-900",
              isNone &&
                "bg-[linear-gradient(135deg,transparent_46%,#ef4444_46%,#ef4444_54%,transparent_54%)] bg-white dark:bg-neutral-800"
            )}
            style={isNone ? undefined : { backgroundColor: color }}
            onClick={() => onPick(isNone ? null : color)}
          />
        )
      })}
    </div>
  )
}
