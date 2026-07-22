import { useEffect, useLayoutEffect, useRef, type RefObject } from "react"
import { cn } from "@/lib/utils"
import { useGrammar } from "./grammar/use-grammar"
import { TextGrammarOverlay } from "./grammar/text-grammar-overlay"
import type { GrammarPopoverLabels } from "./grammar/grammar-popover"

interface EditableTextProps {
  readonly value: string
  readonly onChange?: (value: string) => void
  readonly readOnly?: boolean
  readonly multiline?: boolean
  readonly placeholder?: string
  readonly className?: string
  readonly ariaLabel?: string
  /** Enable Harper grammar checking. Requires `grammarLabels`. */
  readonly grammar?: boolean
  readonly grammarLabels?: GrammarPopoverLabels
  /**
   * Shrink a single-line field to its content width (instead of `w-full`), so
   * short values like dates don't stretch and leave a gap. Uses a CSS grid
   * mirror — no `field-sizing`, works in every browser. Ignored for
   * `multiline` and grammar-enabled fields (which need the overlay layout).
   */
  readonly autoSize?: boolean
}

/** Print/export static text. Empty → null. Stacked fields use block; autoSize stays inline. */
function ReadOnlyText({
  value,
  multiline,
  autoSize,
  className,
}: {
  readonly value: string
  readonly multiline?: boolean
  readonly autoSize?: boolean
  readonly className?: string
}) {
  if (!value?.trim()) return null
  if (multiline) {
    return <p className={cn("whitespace-pre-wrap", className)}>{value}</p>
  }
  // Full-width fields must be block so stacked headers (name → headline)
  // don't run onto one line. autoSize fields stay inline (date ranges).
  const Tag = autoSize ? "span" : "div"
  return <Tag className={className}>{value}</Tag>
}

/**
 * Inline text editor styled to be invisible until focused — it inherits the
 * surrounding typography via `className` so it reads as document text, not a
 * form field. Falls back to a plain node when `readOnly` (or no `onChange`),
 * so the same component drives both an editor and read-only previews/export.
 *
 * `pan-ignore` marks the field so a zoom/pan canvas can exclude it from panning,
 * letting clicks focus + select text instead of dragging the page.
 *
 * Document-agnostic — reuse for résumés, letters, or any editable document.
 */
export function EditableText({
  value: valueProp,
  onChange,
  readOnly,
  multiline,
  placeholder,
  className,
  ariaLabel,
  grammar,
  grammarLabels,
  autoSize,
}: EditableTextProps) {
  // Coerce so missing API fields never throw on `.slice` / controlled inputs.
  const value = valueProp ?? ""
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const grammarOn = Boolean(grammar && grammarLabels && !readOnly && onChange)
  const issues = useGrammar(value, grammarOn)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !multiline) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value, multiline])

  // Blur on outside pointerdown. The zoom/pan canvas preventDefaults pointerdown
  // for panning, suppressing the native blur, so fields stay stuck focused.
  useEffect(() => {
    const handler = (event: PointerEvent) => {
      const el = ref.current
      if (!el || document.activeElement !== el) return
      if (!el.contains(event.target as Node)) {
        el.setSelectionRange(0, 0)
        el.blur()
      }
    }
    document.addEventListener("pointerdown", handler, true)
    return () => document.removeEventListener("pointerdown", handler, true)
  }, [])

  if (readOnly || !onChange) {
    return (
      <ReadOnlyText value={value} multiline={multiline} autoSize={autoSize} className={className} />
    )
  }

  const base =
    "pan-ignore w-full bg-transparent p-0 outline-none transition-colors placeholder:text-neutral-300 rounded-[3px] -mx-0.5 px-0.5 hover:bg-blue-500/[0.04] focus:bg-blue-500/[0.06]"

  const overlay =
    grammarOn && grammarLabels ? (
      <TextGrammarOverlay
        text={value}
        issues={issues}
        multiline={multiline}
        className={className}
        labels={grammarLabels}
        onApply={(start, end, replacement) => onChange(value.slice(0, start) + replacement + value.slice(end))}
      />
    ) : null

  const field = multiline ? (
    <textarea
      ref={ref as RefObject<HTMLTextAreaElement>}
      rows={1}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className={cn(base, "block resize-none overflow-hidden whitespace-pre-wrap", className)}
    />
  ) : (
    <input
      ref={ref as RefObject<HTMLInputElement>}
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      // `size={1}` drops the input's ~20ch intrinsic min-width so, in autoSize
      // mode, the grid cell collapses to the mirror's content width.
      size={autoSize && !multiline && !overlay ? 1 : undefined}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
      className={cn(base, autoSize && !overlay && "col-start-1 row-start-1 min-w-0", className)}
    />
  )

  // Content-width single-line field: a CSS-grid mirror sizes the input to its
  // text (or placeholder). The invisible mirror shares the input's typography
  // (via `className`) and horizontal box (px-0.5) so widths line up exactly.
  if (autoSize && !multiline && !overlay) {
    return (
      <span className="inline-grid">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none invisible col-start-1 row-start-1 whitespace-pre px-0.5",
            className
          )}
        >
          {value || placeholder || ""}
        </span>
        {field}
      </span>
    )
  }

  // Only introduce the positioning wrapper when there's an overlay to host —
  // bare fields keep their original inline/flex layout untouched.
  if (!overlay) return field
  return (
    <div className="relative">
      {field}
      {overlay}
    </div>
  )
}
