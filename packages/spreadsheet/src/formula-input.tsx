import {
  useEffect,
  useRef,
  type FocusEventHandler,
  type MouseEventHandler,
} from "react"
import { MentionPopup, useMention } from "@mockmatch/ui/mention"
import { cn } from "@mockmatch/ui/utils"
import { FormulaHighlight } from "./formula/highlight"
import {
  getFormulaFunctionQuery,
  getFormulaFunctionSuggestions,
} from "./formula/functions"

export type FormulaInputProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onCommit?: (meta?: {
    shiftKey: boolean
    key: "Enter" | "Tab"
  }) => void
  readonly onCancel?: () => void
  /** When true, Tab commits (cell editor). Formula bar leaves Tab alone. */
  readonly commitOnTab?: boolean
  readonly readOnly?: boolean
  readonly disabled?: boolean
  /** Styles shared by the transparent field + colored mirror. */
  readonly className?: string
  readonly "aria-label"?: string
  readonly autoFocus?: boolean
  /** Controlled caret (e.g. after click-to-insert ref). */
  readonly caret?: number
  readonly onCaretChange?: (caret: number) => void
  readonly onFocus?: FocusEventHandler<HTMLInputElement>
  /** Forwarded for cell editor focus / query selectors. */
  readonly "data-spreadsheet-cell-editor"?: string | boolean
  readonly onMouseDown?: MouseEventHandler<HTMLInputElement>
  readonly onBlur?: FocusEventHandler<HTMLInputElement>
}

const FORMULA_SUGGESTIONS = getFormulaFunctionSuggestions()

/**
 * Formula field: Excel-like syntax colors + function typeahead via {@link useMention}.
 */
export function FormulaInput({
  value,
  onChange,
  onCommit,
  onCancel,
  commitOnTab = false,
  readOnly,
  disabled,
  className,
  autoFocus,
  caret,
  onCaretChange,
  onFocus,
  onMouseDown,
  onBlur,
  ...rest
}: FormulaInputProps) {
  const anchorRef = useRef<HTMLInputElement>(null)
  const isDisabled = Boolean(disabled || readOnly)
  const lastAppliedCaret = useRef<number | null>(null)

  const mention = useMention({
    value,
    onChange,
    suggestions: FORMULA_SUGGESTIONS,
    getQuery: getFormulaFunctionQuery,
    limit: 12,
    disabled: isDisabled,
    anchorRef,
  })

  const reportCaret = (n: number) => {
    onCaretChange?.(n)
  }

  // Apply caret from host (ref pick insert) without fighting user typing.
  useEffect(() => {
    if (caret === undefined) return
    if (lastAppliedCaret.current === caret) return
    const el = anchorRef.current
    if (!el || document.activeElement !== el) return
    const next = Math.max(0, Math.min(value.length, caret))
    lastAppliedCaret.current = caret
    el.setSelectionRange(next, next)
  }, [caret, value])

  // Shared box + type metrics — any mismatch moves the caret vs colored text.
  // Defaults first; `className` last so cell editor / formula bar can kill ring+border.
  const fieldClass = cn(
    "box-border h-8 w-full min-w-0 rounded-lg border border-input px-2.5 py-1",
    "text-base leading-normal font-normal not-italic tracking-normal md:text-sm",
    "[font-kerning:none] [font-variant-ligatures:none]",
    "outline-none transition-colors",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    className
  )

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 flex-1">
      <FormulaHighlight
        value={value}
        className={cn(
          fieldClass,
          // Same border width as input (transparent) so content origin matches
          "border-transparent bg-transparent text-foreground shadow-none ring-0",
          "focus-visible:border-transparent focus-visible:ring-0"
        )}
      />
      <input
        ref={anchorRef}
        type="text"
        data-slot="formula-input"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={isDisabled}
        readOnly={readOnly}
        value={value}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={mention.open}
        aria-controls={mention.open ? mention.listboxId : undefined}
        aria-activedescendant={mention.activeOptionId}
        aria-autocomplete="list"
        className={cn(
          fieldClass,
          // Caret from this layer; glyphs invisible so mirror shows through
          "relative z-10 bg-transparent text-transparent caret-blue-500",
          "selection:bg-blue-400/40 selection:text-neutral-900 dark:selection:text-neutral-50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-transparent"
        )}
        onChange={(e) => {
          const next = e.target.value
          const nextCaret = e.target.selectionStart ?? next.length
          lastAppliedCaret.current = nextCaret
          onChange(next)
          reportCaret(nextCaret)
          mention.sync(nextCaret, { fromUserEdit: true, value: next })
        }}
        onKeyDown={(e) => {
          if (mention.onKeyDown(e)) return
          if (e.key === "Enter") {
            e.preventDefault()
            e.stopPropagation()
            onCommit?.({ shiftKey: e.shiftKey, key: "Enter" })
            return
          }
          if (commitOnTab && e.key === "Tab") {
            e.preventDefault()
            e.stopPropagation()
            onCommit?.({ shiftKey: e.shiftKey, key: "Tab" })
            return
          }
          if (e.key === "Escape") {
            e.preventDefault()
            e.stopPropagation()
            onCancel?.()
          }
        }}
        onKeyUp={(e) => {
          // Arrow keys only move list highlight — do not re-sync (would fight highlight)
          if (
            e.key === "ArrowDown" ||
            e.key === "ArrowUp" ||
            e.key === "Enter" ||
            e.key === "Tab" ||
            e.key === "Escape"
          ) {
            return
          }
          const c = e.currentTarget.selectionStart ?? value.length
          lastAppliedCaret.current = c
          reportCaret(c)
          mention.sync(c)
        }}
        onClick={(e) => {
          const c = e.currentTarget.selectionStart ?? value.length
          lastAppliedCaret.current = c
          reportCaret(c)
          mention.sync(c)
        }}
        onSelect={(e) => {
          const c = e.currentTarget.selectionStart ?? value.length
          lastAppliedCaret.current = c
          reportCaret(c)
          mention.sync(c)
        }}
        onBlur={(e) => {
          mention.onBlur()
          onBlur?.(e)
        }}
        onFocus={(e) => {
          mention.onFocus()
          onFocus?.(e)
        }}
        onMouseDown={onMouseDown}
        {...rest}
      />
      <MentionPopup
        open={mention.open}
        coords={mention.coords}
        filtered={mention.filtered}
        highlight={mention.highlight}
        setHighlight={mention.setHighlight}
        accept={mention.accept}
        listboxId={mention.listboxId}
        listRef={mention.listRef}
        emptyLabel="No functions"
      />
    </div>
  )
}
