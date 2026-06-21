import { useEffect, useLayoutEffect, useRef, type RefObject } from "react"
import { cn } from "@/lib/utils"

interface EditableTextProps {
  readonly value: string
  readonly onChange?: (value: string) => void
  readonly readOnly?: boolean
  readonly multiline?: boolean
  readonly placeholder?: string
  readonly className?: string
  readonly ariaLabel?: string
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
  value,
  onChange,
  readOnly,
  multiline,
  placeholder,
  className,
  ariaLabel,
}: EditableTextProps) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

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
    if (!value) return null
    const Tag = multiline ? "p" : "span"
    return <Tag className={cn(multiline && "whitespace-pre-wrap", className)}>{value}</Tag>
  }

  const base =
    "pan-ignore w-full bg-transparent p-0 outline-none transition-colors placeholder:text-neutral-300 rounded-[3px] -mx-0.5 px-0.5 hover:bg-blue-500/[0.04] focus:bg-blue-500/[0.06]"

  if (multiline) {
    return (
      <textarea
        ref={ref as RefObject<HTMLTextAreaElement>}
        rows={1}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        className={cn(base, "block resize-none overflow-hidden whitespace-pre-wrap", className)}
      />
    )
  }

  return (
    <input
      ref={ref as RefObject<HTMLInputElement>}
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
      className={cn(base, className)}
    />
  )
}
