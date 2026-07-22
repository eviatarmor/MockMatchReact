import { EditableText } from "@/components/document-editor"
import { cn } from "@/lib/utils"

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

/** Free-form start – end dates. No validation; print hides blanks / lone dash. */
export function DateRangeFields({
  start,
  end,
  onStart,
  onEnd,
  editable,
  muted,
  startPh,
  endPh,
}: {
  readonly start: string
  readonly end: string
  readonly onStart?: (v: string) => void
  readonly onEnd?: (v: string) => void
  readonly editable: boolean
  readonly muted: string
  readonly startPh: string
  readonly endPh: string
}) {
  const startFilled = hasText(start)
  const endFilled = hasText(end)
  if (!editable && !startFilled && !endFilled) return null
  const showDash = editable || (startFilled && endFilled)
  return (
    <div className={cn("flex items-baseline justify-end gap-1 text-xs", muted)}>
      {(editable || startFilled) && (
        <EditableText
          value={start}
          onChange={editable ? onStart : undefined}
          placeholder={editable ? startPh : undefined}
          ariaLabel={startPh}
          autoSize
        />
      )}
      {showDash ? <span>-</span> : null}
      {(editable || endFilled) && (
        <EditableText
          value={end}
          onChange={editable ? onEnd : undefined}
          placeholder={editable ? endPh : undefined}
          ariaLabel={endPh}
          autoSize
        />
      )}
    </div>
  )
}
