import { useEffect, useId, useRef, useState } from "react"
import { Check, X } from "lucide-react"
import { cn } from "@mockmatch/ui/utils"
import { normalizeLinkUrl } from "../lib/formats"

/**
 * Animated inline link editor: slides open inside the floating toolbar.
 * Replaces `window.prompt` for URL entry.
 */
export function LinkSlide({
  open,
  initialUrl,
  placeholder,
  applyLabel,
  removeLabel,
  onApply,
  onRemove,
  onClose,
}: {
  readonly open: boolean
  readonly initialUrl: string
  readonly placeholder: string
  readonly applyLabel: string
  readonly removeLabel?: string
  readonly onApply: (url: string) => void
  readonly onRemove?: () => void
  readonly onClose: () => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(initialUrl)

  useEffect(() => {
    if (!open) return
    setUrl(initialUrl || "https://")
    // Focus after expand transition starts
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [open, initialUrl])

  if (!open) return null

  const submit = () => {
    const next = normalizeLinkUrl(url)
    if (!next) return
    onApply(next)
  }

  return (
    <div
      data-rich-text-link-slide
      className={cn(
        "flex items-center gap-1 overflow-hidden",
        "animate-in fade-in-0 slide-in-from-left-2 duration-150"
      )}
      onMouseDown={(e) => e.preventDefault()}
    >
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-7 w-[11rem] rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-900 outline-none",
          "placeholder:text-neutral-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/40",
          "dark:border-white/15 dark:bg-neutral-950 dark:text-white"
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          }
          if (e.key === "Escape") {
            e.preventDefault()
            onClose()
          }
        }}
      />
      <button
        type="button"
        aria-label={applyLabel}
        title={applyLabel}
        className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-500"
        onClick={submit}
      >
        <Check className="size-3.5" />
      </button>
      {onRemove && removeLabel && (
        <button
          type="button"
          aria-label={removeLabel}
          title={removeLabel}
          className="flex size-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10"
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
