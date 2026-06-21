import { Fragment, useState } from "react"
import { cn } from "@/lib/utils"
import type { GrammarIssue } from "@/lib/grammar/harper"
import { GrammarPopover, type GrammarPopoverLabels } from "./grammar-popover"

interface TextGrammarOverlayProps {
  readonly text: string
  readonly issues: readonly GrammarIssue[]
  readonly multiline?: boolean
  /** Typography classes — must match the underlying field so the mirror aligns. */
  readonly className?: string
  readonly labels: GrammarPopoverLabels
  readonly onApply: (start: number, end: number, replacement: string) => void
}

interface ActivePopover {
  readonly issue: GrammarIssue
  readonly anchor: { top: number; left: number; bottom: number }
}

/**
 * A transparent mirror of a text field's content, laid exactly over it, that
 * draws wavy underlines beneath grammar issues. The mirror is click-through
 * (`pointer-events-none`) except on the marks, so typing/selection still hit the
 * real field underneath while a mark can be clicked to open its suggestions.
 *
 * Alignment relies on the overlay sharing the field's typography (`className`)
 * and structural padding, so callers must pass the same `className`.
 */
export function TextGrammarOverlay({ text, issues, multiline, className, labels, onApply }: TextGrammarOverlayProps) {
  const [active, setActive] = useState<ActivePopover | null>(null)

  // Skip issues that fall outside the current text (stale debounced results).
  const valid = issues.filter((issue) => issue.start < issue.end && issue.end <= text.length)

  const segments: { text: string; issue?: GrammarIssue }[] = []
  let cursor = 0
  for (const issue of [...valid].sort((a, b) => a.start - b.start)) {
    if (issue.start < cursor) continue // overlapping — keep the first
    if (issue.start > cursor) segments.push({ text: text.slice(cursor, issue.start) })
    segments.push({ text: text.slice(issue.start, issue.end), issue })
    cursor = issue.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) })

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pan-ignore pointer-events-none absolute inset-0 -mx-0.5 px-0.5",
          multiline ? "whitespace-pre-wrap break-words" : "overflow-hidden whitespace-pre",
          className,
          // After `className` so the mirror text stays invisible regardless of the
          // field's own text color.
          "text-transparent selection:bg-transparent"
        )}
      >
        {segments.map((segment, index) =>
          segment.issue ? (
            <span
              // Offsets make a stable enough key for transient marks.
              key={`${segment.issue.start}-${segment.issue.end}`}
              className="pointer-events-auto cursor-pointer underline decoration-red-500 decoration-wavy decoration-2 [text-decoration-skip-ink:none]"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                setActive({
                  issue: segment.issue!,
                  anchor: { top: rect.top, bottom: rect.bottom, left: rect.left + rect.width / 2 },
                })
              }}
            >
              {segment.text}
            </span>
          ) : (
            <Fragment key={`t-${index}`}>{segment.text}</Fragment>
          )
        )}
        {/* Trailing newline so an auto-growing mirror matches the textarea height. */}
        {multiline && "\n"}
      </div>

      {active && (
        <GrammarPopover
          issue={active.issue}
          anchor={active.anchor}
          labels={labels}
          onApply={(replacement) => {
            onApply(active.issue.start, active.issue.end, replacement)
            setActive(null)
          }}
          onClose={() => setActive(null)}
        />
      )}
    </>
  )
}
