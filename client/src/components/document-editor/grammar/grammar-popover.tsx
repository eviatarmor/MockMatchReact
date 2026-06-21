import { useEffect } from "react"
import { createPortal } from "react-dom"
import type { GrammarIssue } from "@/lib/grammar/harper"

export interface GrammarPopoverLabels {
  readonly apply: string
  readonly noSuggestions: string
  readonly dismiss: string
}

interface GrammarPopoverProps {
  readonly issue: GrammarIssue
  /** Anchor rectangle in viewport coordinates (e.g. a mark's getBoundingClientRect). */
  readonly anchor: { top: number; left: number; bottom: number }
  readonly labels: GrammarPopoverLabels
  readonly onApply: (replacement: string) => void
  readonly onClose: () => void
}

/**
 * Floating card listing a grammar issue's message and replacement suggestions.
 * Portaled to the body and positioned under its anchor so it sits correctly
 * even inside the zoom/pan canvas. Closes on outside pointerdown or Escape.
 */
export function GrammarPopover({ issue, anchor, labels, onApply, onClose }: GrammarPopoverProps) {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest("[data-grammar-popover]")) return
      onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [onClose])

  return createPortal(
    <div
      data-grammar-popover
      className="pan-ignore fixed z-[60] w-64 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
      style={{ top: anchor.bottom + 8, left: anchor.left }}
    >
      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-red-500">{issue.kind}</p>
      <p className="mb-2 text-sm text-neutral-700 dark:text-neutral-200">{issue.message}</p>
      {issue.replacements.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {issue.replacements.slice(0, 6).map((replacement) => (
            <button
              key={replacement}
              type="button"
              onClick={() => onApply(replacement)}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm text-neutral-900 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
              title={labels.apply}
            >
              {replacement || labels.dismiss}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-neutral-400">{labels.noSuggestions}</p>
      )}
    </div>,
    document.body
  )
}
