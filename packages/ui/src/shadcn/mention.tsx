"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "../lib/utils"

/** One row in the suggestion popup. */
export type MentionSuggestion = {
  /** Unique id; falls back to `value` when omitted. */
  readonly id?: string
  /** Text inserted at the active query range (e.g. `SUM(` or `@Alice `). */
  readonly value: string
  /** Primary label in the list. */
  readonly label: string
  /** Optional secondary line / hint. */
  readonly description?: string
  /** Extra filter tokens. */
  readonly keywords?: readonly string[]
}

/** Active token being completed inside the host field value. */
export type MentionQueryMatch = {
  /** Inclusive start index of the token to replace. */
  readonly start: number
  /** Exclusive end index (usually the caret). */
  readonly end: number
  /** Substring used for filtering. */
  readonly query: string
}

export type MentionGetQuery = (
  value: string,
  caret: number
) => MentionQueryMatch | null

export function mentionDefaultGetQuery(
  value: string,
  caret: number,
  trigger: string
): MentionQueryMatch | null {
  if (!trigger || caret < 0 || caret > value.length) return null
  const before = value.slice(0, caret)
  const idx = before.lastIndexOf(trigger)
  if (idx < 0) return null
  const query = before.slice(idx + trigger.length)
  if (/[\s]/.test(query)) return null
  if (trigger.length === 1 && query.includes(trigger)) return null
  return {
    start: idx + trigger.length,
    end: caret,
    query,
  }
}

export function mentionSuggestionKey(s: MentionSuggestion): string {
  return s.id ?? s.value
}

function matchesSuggestion(s: MentionSuggestion, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  if (s.label.toLowerCase().startsWith(q)) return true
  if (s.value.toLowerCase().startsWith(q)) return true
  if (s.label.toLowerCase().includes(q)) return true
  if (s.keywords?.some((k) => k.toLowerCase().includes(q))) return true
  return false
}

function rankSuggestion(s: MentionSuggestion, query: string): number {
  if (!query) return 0
  const q = query.toLowerCase()
  const label = s.label.toLowerCase()
  if (label === q) return 0
  if (label.startsWith(q)) return 1
  if (s.value.toLowerCase().startsWith(q)) return 2
  return 3
}

export function mentionFilterSuggestions(
  suggestions: readonly MentionSuggestion[],
  query: string,
  limit: number
): MentionSuggestion[] {
  return suggestions
    .filter((s) => matchesSuggestion(s, query))
    .sort((a, b) => {
      const ra = rankSuggestion(a, query)
      const rb = rankSuggestion(b, query)
      if (ra !== rb) return ra - rb
      return a.label.localeCompare(b.label)
    })
    .slice(0, limit)
}

export type UseMentionOptions = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly suggestions: readonly MentionSuggestion[]
  /** Detect the active token at the caret. Default: after `trigger`. */
  readonly getQuery?: MentionGetQuery
  /** Used by default getQuery. Default `"@"`. */
  readonly trigger?: string
  readonly limit?: number
  readonly disabled?: boolean
  readonly onSelectSuggestion?: (suggestion: MentionSuggestion) => void
  /**
   * Host field ref (`input` / `textarea`). Used for caret restore + popup anchor.
   */
  readonly anchorRef: React.RefObject<
    HTMLInputElement | HTMLTextAreaElement | null
  >
}

export type UseMentionResult = {
  readonly open: boolean
  readonly filtered: readonly MentionSuggestion[]
  readonly highlight: number
  readonly setHighlight: React.Dispatch<React.SetStateAction<number>>
  readonly match: MentionQueryMatch | null
  readonly listboxId: string
  readonly activeOptionId: string | undefined
  readonly coords: { top: number; left: number; width: number } | null
  readonly listRef: React.RefObject<HTMLDivElement | null>
  readonly accept: (suggestion: MentionSuggestion) => void
  readonly close: () => void
  /**
   * Recompute open state from caret.
   * Pass the **current field value** when it may be ahead of the React `value` prop
   * (e.g. inside `onChange` before parent re-renders).
   */
  readonly sync: (
    caret: number,
    opts?: { fromUserEdit?: boolean; value?: string }
  ) => void
  /**
   * Keyboard handler for the host field. Returns true when consumed
   * (arrows / accept / escape while open).
   */
  readonly onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => boolean
  readonly onBlur: () => void
  readonly onFocus: () => void
}

/**
 * Headless mention / typeahead. Pair with any `input` or `textarea` and
 * render {@link MentionPopup} when `open`.
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLTextAreaElement>(null)
 * const mention = useMention({ value, onChange, suggestions, anchorRef: ref })
 * return (
 *   <>
 *     <textarea ref={ref} value={value} onChange={...} onKeyDown={(e) => {
 *       if (mention.onKeyDown(e)) return
 *     }} />
 *     <MentionPopup {...mention} emptyLabel="No matches" />
 *   </>
 * )
 * ```
 */
export function useMention({
  value,
  onChange,
  suggestions,
  getQuery: getQueryProp,
  trigger = "@",
  limit = 10,
  disabled = false,
  onSelectSuggestion,
  anchorRef,
}: UseMentionOptions): UseMentionResult {
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const [caret, setCaret] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(0)
  const [coords, setCoords] = React.useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  /** Bumps when suppressOpen flips so open UI re-renders. */
  const [epoch, setEpoch] = React.useState(0)
  const pendingCaret = React.useRef<number | null>(null)
  /** After accept, keep list closed until the user types again. */
  const suppressOpen = React.useRef(false)
  /** Last active query string — only reset highlight when this changes. */
  const lastQueryRef = React.useRef<string | null>(null)
  const blurTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const listboxId = React.useId()

  const getQuery = React.useCallback(
    (v: string, c: number) =>
      getQueryProp ? getQueryProp(v, c) : mentionDefaultGetQuery(v, c, trigger),
    [getQueryProp, trigger]
  )

  const match = React.useMemo(
    () => getQuery(value, caret),
    [getQuery, value, caret]
  )

  const filtered = React.useMemo(() => {
    if (!match) return []
    return mentionFilterSuggestions(suggestions, match.query, limit)
  }, [match, suggestions, limit])

  const effectivelyOpen =
    open && match != null && !disabled && !suppressOpen.current
  // epoch is only for forcing re-read of suppressOpen.current
  void epoch

  const updateCoords = React.useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords((prev) => {
      const next = {
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 200),
      }
      if (
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width
      ) {
        return prev
      }
      return next
    })
  }, [anchorRef])

  const sync = React.useCallback(
    (
      nextCaret: number,
      opts?: { fromUserEdit?: boolean; value?: string }
    ) => {
      if (opts?.fromUserEdit) {
        suppressOpen.current = false
        setEpoch((e) => e + 1)
      }
      setCaret(nextCaret)
      if (suppressOpen.current && !opts?.fromUserEdit) {
        setOpen(false)
        return
      }
      if (suppressOpen.current) {
        setOpen(false)
        return
      }
      const live = opts?.value ?? anchorRef.current?.value ?? value
      const m = getQuery(live, nextCaret)
      setOpen(m != null)
      // Reset highlight only when the filter query changes — not on every
      // keyup/caret sync (ArrowDown would otherwise snap back to 0).
      if (m) {
        if (lastQueryRef.current !== m.query) {
          lastQueryRef.current = m.query
          setHighlight(0)
        }
      } else {
        lastQueryRef.current = null
      }
    },
    [anchorRef, getQuery, value]
  )

  React.useLayoutEffect(() => {
    if (pendingCaret.current == null) return
    const el = anchorRef.current
    const pos = pendingCaret.current
    pendingCaret.current = null
    if (!el) return
    el.focus()
    el.setSelectionRange(pos, pos)
    setCaret(pos)
  }, [anchorRef, value])

  React.useEffect(() => {
    if (!effectivelyOpen) return
    updateCoords()
    const onReposition = (e: Event) => {
      // Do not reposition (or re-render) when the popup itself scrolls
      const t = e.target
      if (
        t instanceof Node &&
        listRef.current &&
        (t === listRef.current || listRef.current.contains(t))
      ) {
        return
      }
      updateCoords()
    }
    window.addEventListener("resize", onReposition)
    document.addEventListener("scroll", onReposition, true)
    return () => {
      window.removeEventListener("resize", onReposition)
      document.removeEventListener("scroll", onReposition, true)
    }
  }, [effectivelyOpen, updateCoords, value, filtered.length])

  React.useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current)
    }
  }, [])

  React.useEffect(() => {
    if (highlight >= filtered.length) {
      setHighlight(Math.max(0, filtered.length - 1))
    }
  }, [filtered.length, highlight])

  const accept = React.useCallback(
    (suggestion: MentionSuggestion) => {
      const el = anchorRef.current
      const c = el?.selectionStart ?? caret
      const liveValue = el?.value ?? value
      const m = getQuery(liveValue, c)
      if (!m) return
      const next =
        liveValue.slice(0, m.start) + suggestion.value + liveValue.slice(m.end)
      const nextCaret = m.start + suggestion.value.length
      pendingCaret.current = nextCaret
      suppressOpen.current = true
      setEpoch((e) => e + 1)
      setOpen(false)
      setCaret(nextCaret)
      onChange(next)
      onSelectSuggestion?.(suggestion)
    },
    [anchorRef, caret, getQuery, onChange, onSelectSuggestion, value]
  )

  const close = React.useCallback(() => {
    setOpen(false)
  }, [])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!effectivelyOpen || filtered.length === 0) return false
      if (e.key === "ArrowDown") {
        e.preventDefault()
        e.stopPropagation()
        setHighlight((h) => (h + 1) % filtered.length)
        return true
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        e.stopPropagation()
        setHighlight((h) => (h - 1 + filtered.length) % filtered.length)
        return true
      }
      if (e.key === "Enter" || e.key === "Tab") {
        const item = filtered[highlight]
        if (item) {
          e.preventDefault()
          e.stopPropagation()
          accept(item)
          return true
        }
      }
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        return true
      }
      return false
    },
    [accept, effectivelyOpen, filtered, highlight]
  )

  const onBlur = React.useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    blurTimer.current = setTimeout(() => setOpen(false), 120)
  }, [])

  const onFocus = React.useCallback(() => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
    const el = anchorRef.current
    if (!el) return
    sync(el.selectionStart ?? el.value.length)
  }, [anchorRef, sync])

  const activeOptionId =
    effectivelyOpen && filtered[highlight]
      ? `${listboxId}-${mentionSuggestionKey(filtered[highlight]!)}`
      : undefined

  return {
    open: effectivelyOpen,
    filtered,
    highlight,
    setHighlight,
    match,
    listboxId,
    activeOptionId,
    coords,
    listRef,
    accept,
    close,
    sync,
    onKeyDown,
    onBlur,
    onFocus,
  }
}

export type MentionPopupProps = {
  readonly open: boolean
  readonly coords: { top: number; left: number; width: number } | null
  readonly filtered: readonly MentionSuggestion[]
  readonly highlight: number
  readonly setHighlight: React.Dispatch<React.SetStateAction<number>>
  readonly accept: (suggestion: MentionSuggestion) => void
  readonly listboxId: string
  readonly listRef: React.RefObject<HTMLDivElement | null>
  readonly emptyLabel?: string
  readonly className?: string
}

/**
 * Portaled suggestion list for {@link useMention}.
 * Wheel/trackpad scroll stays on this panel; option rows use mousedown
 * preventDefault so the host field keeps focus.
 */
export function MentionPopup({
  open,
  coords,
  filtered,
  highlight,
  setHighlight,
  accept,
  listboxId,
  listRef,
  emptyLabel = "No matches",
  className,
}: MentionPopupProps) {
  const itemRefs = React.useRef<Map<number, HTMLDivElement>>(new Map())

  React.useEffect(() => {
    if (!open) return
    const el = itemRefs.current.get(highlight)
    el?.scrollIntoView({ block: "nearest" })
  }, [highlight, open, filtered.length])

  if (!open || !coords || typeof document === "undefined") return null

  return createPortal(
    <div
      ref={listRef}
      id={listboxId}
      role="listbox"
      data-slot="mention-popup"
      className={cn(
        "fixed z-50 max-h-60 overflow-y-auto overscroll-contain rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10",
        "pointer-events-auto touch-pan-y",
        className
      )}
      style={{
        top: coords.top,
        left: coords.left,
        width: coords.width,
      }}
      onWheel={(e) => {
        e.stopPropagation()
      }}
    >
      {filtered.length === 0 ? (
        <div className="px-2 py-2 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        filtered.map((s, i) => {
          const key = mentionSuggestionKey(s)
          const selected = i === highlight
          return (
            <div
              key={key}
              ref={(node) => {
                if (node) itemRefs.current.set(i, node)
                else itemRefs.current.delete(i)
              }}
              id={`${listboxId}-${key}`}
              role="option"
              aria-selected={selected}
              data-highlighted={selected || undefined}
              className={cn(
                "relative flex w-full cursor-default flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm outline-hidden select-none",
                selected
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60"
              )}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                accept(s)
              }}
            >
              <span className="truncate font-medium">{s.label}</span>
              {s.description ? (
                <span className="truncate text-2xs text-muted-foreground">
                  {s.description}
                </span>
              ) : null}
            </div>
          )
        })
      )}
    </div>,
    document.body
  )
}

// ─── Thin input helper (optional) ────────────────────────────────

const INPUT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

export type MentionInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type" | "size"
> & {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly suggestions: readonly MentionSuggestion[]
  readonly trigger?: string
  readonly getQuery?: MentionGetQuery
  readonly limit?: number
  readonly emptyLabel?: string
  readonly listClassName?: string
  readonly onSelectSuggestion?: (suggestion: MentionSuggestion) => void
}

/**
 * Convenience: shadcn-styled input wired to {@link useMention}.
 * Prefer {@link useMention} + your own field for textarea / custom chrome.
 */
export function MentionInput({
  value,
  onChange,
  suggestions,
  trigger = "@",
  getQuery,
  limit = 10,
  emptyLabel = "No matches",
  listClassName,
  onSelectSuggestion,
  className,
  onKeyDown,
  onBlur,
  onClick,
  onSelect,
  onKeyUp,
  disabled,
  ...props
}: MentionInputProps) {
  const anchorRef = React.useRef<HTMLInputElement>(null)
  const mention = useMention({
    value,
    onChange,
    suggestions,
    trigger,
    getQuery,
    limit,
    disabled,
    onSelectSuggestion,
    anchorRef,
  })

  return (
    <div className="relative min-w-0 w-full" data-slot="mention-input">
      <input
        ref={anchorRef}
        type="text"
        data-slot="mention-input-field"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        role="combobox"
        aria-expanded={mention.open}
        aria-controls={mention.open ? mention.listboxId : undefined}
        aria-activedescendant={mention.activeOptionId}
        aria-autocomplete="list"
        className={cn(INPUT_CLASS, className)}
        onChange={(e) => {
          const next = e.target.value
          const nextCaret = e.target.selectionStart ?? next.length
          onChange(next)
          mention.sync(nextCaret, { fromUserEdit: true, value: next })
        }}
        onKeyDown={(e) => {
          if (mention.onKeyDown(e)) return
          onKeyDown?.(e)
        }}
        onKeyUp={(e) => {
          if (
            e.key === "ArrowDown" ||
            e.key === "ArrowUp" ||
            e.key === "Enter" ||
            e.key === "Tab" ||
            e.key === "Escape"
          ) {
            onKeyUp?.(e)
            return
          }
          mention.sync(e.currentTarget.selectionStart ?? value.length)
          onKeyUp?.(e)
        }}
        onClick={(e) => {
          mention.sync(e.currentTarget.selectionStart ?? value.length)
          onClick?.(e)
        }}
        onSelect={(e) => {
          mention.sync(e.currentTarget.selectionStart ?? value.length)
          onSelect?.(e)
        }}
        onBlur={(e) => {
          mention.onBlur()
          onBlur?.(e)
        }}
        onFocus={() => mention.onFocus()}
        {...props}
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
        emptyLabel={emptyLabel}
        className={listClassName}
      />
    </div>
  )
}
