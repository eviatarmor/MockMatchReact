import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUp, Square } from "lucide-react"
import type { SourceDocumentUIPart } from "ai"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import {
  Attachment,
  AttachmentHoverCard,
  AttachmentHoverCardContent,
  AttachmentHoverCardTrigger,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import {
  Mention,
  MentionContent,
  MentionInput,
  MentionItem,
} from "@/components/ui/mention"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDocumentAssistant } from "../document-assistant-context"
import type { MentionTarget } from "../types"

type AssistantInputProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onSubmit: () => void
  readonly onStop?: () => void
  readonly isBusy: boolean
  readonly targets: readonly MentionTarget[]
  readonly resetKey?: string | number
  readonly className?: string
}

function appendTranscript(current: string, next: string): string {
  const piece = next.trim()
  if (!piece) return current
  const base = current.trimEnd()
  if (!base) return piece
  return `${base} ${piece}`
}

/** One-line preview for selection attachment chips. */
function truncateAttachmentText(text: string, max = 48): string {
  const oneLine = text.replace(/\s+/g, " ").trim()
  if (oneLine.length <= max) return oneLine
  return `${oneLine.slice(0, max - 1)}…`
}

/**
 * DiceUI filters by item `value` (our section ids). Map search term onto labels
 * so `@sum` matches "Summary".
 */
function createLabelFilter(targets: readonly MentionTarget[]) {
  const byId = new Map(targets.map((t) => [t.id, t]))
  return (options: string[], term: string): string[] => {
    const q = term.trim().toLowerCase()
    if (!q) return options
    return options.filter((id) => {
      const t = byId.get(id)
      if (!t) return id.toLowerCase().includes(q)
      return (
        t.label.toLowerCase().includes(q) ||
        t.kind.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q)
      )
    })
  }
}

export function AssistantInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isBusy,
  targets,
  resetKey = 0,
  className,
}: AssistantInputProps) {
  const { t, i18n } = useTranslation()
  const {
    i18nNs,
    mentionIds,
    setMentionIds,
    attachments,
    removeAttachment,
    pendingInsertId,
    clearPendingInsert,
  } = useDocumentAssistant()

  const [interim, setInterim] = useState("")
  const [isListening, setIsListening] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const insertAttemptRef = useRef<string | null>(null)

  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    setInterim("")
    setIsListening(false)
  }, [resetKey])

  const handleFinalTranscript = useCallback(
    (text: string) => {
      const piece = text.trim()
      if (!piece) return
      const nextValue = appendTranscript(valueRef.current, piece)
      valueRef.current = nextValue
      onChange(nextValue)
      setInterim("")
    },
    [onChange]
  )

  const displayValue =
    isListening && interim.trim()
      ? appendTranscript(value, interim)
      : value

  const canSend = value.trim().length > 0 && !isBusy
  const speechLang = i18n.language || "en-US"

  const onFilter = useMemo(() => createLabelFilter(targets), [targets])

  // Stable array ref for Dice controlled `value` — avoid new [] every render.
  const mentionValue = useMemo(() => [...mentionIds], [mentionIds])

  const attachmentData = useMemo(
    () =>
      attachments.map((a) => {
        const preview = truncateAttachmentText(a.text)
        const data: SourceDocumentUIPart & { id: string } = {
          id: a.id,
          type: "source-document",
          sourceId: a.id,
          mediaType: "text/plain",
          title: preview,
          filename: "selection.txt",
        }
        return { attachment: a, data, preview }
      }),
    [attachments]
  )

  /**
   * Block AI icon → open panel + inject @tag into the Dice textarea
   * (tags live in the field, not as chips).
   */
  useEffect(() => {
    if (!pendingInsertId) {
      insertAttemptRef.current = null
      return
    }
    if (insertAttemptRef.current === pendingInsertId) return
    if (mentionIds.includes(pendingInsertId)) {
      clearPendingInsert()
      return
    }

    const target = targets.find((t) => t.id === pendingInsertId)
    if (!target) return

    insertAttemptRef.current = pendingInsertId

    let cancelled = false
    let tries = 0

    const run = () => {
      if (cancelled) return
      const root = rootRef.current
      if (!root) {
        if (tries++ < 20) requestAnimationFrame(run)
        return
      }

      const input = root.querySelector<HTMLTextAreaElement | HTMLInputElement>(
        '[data-slot="mention-input"]'
      )
      if (!input) {
        if (tries++ < 20) requestAnimationFrame(run)
        return
      }

      // Ensure a trailing `@` so Dice can resolve the trigger + click the item.
      const cur = valueRef.current
      const next =
        cur.length === 0
          ? "@"
          : cur.endsWith("@")
            ? cur
            : `${cur}${/\s$/.test(cur) ? "" : " "}@`

      if (next !== cur) {
        onChange(next)
        valueRef.current = next
        // Let controlled inputValue flush, then click the matching item.
        requestAnimationFrame(() => {
          if (cancelled) return
          clickItem()
        })
        return
      }

      clickItem()

      function clickItem() {
        if (cancelled) return
        const items = root!.querySelectorAll<HTMLElement>(
          '[data-slot="mention-item"]'
        )
        let found: HTMLElement | null = null
        for (const el of items) {
          // Prefer data-value if present; fall back to visible label text.
          const text = (el.textContent ?? "").trim()
          if (
            text === target!.label ||
            text.startsWith(target!.label) ||
            text.includes(target!.label)
          ) {
            // Prefer the item whose primary label line matches exactly.
            const primary = el.querySelector("span")?.textContent?.trim()
            if (primary === target!.label || text.startsWith(target!.label)) {
              found = el
              break
            }
            found ??= el
          }
        }

        if (!found) {
          if (tries++ < 30) {
            requestAnimationFrame(run)
            return
          }
          clearPendingInsert()
          return
        }

        // Dice onMentionAdd needs focus + a trigger `@` before the caret.
        input!.focus()
        const len = input!.value.length
        input!.setSelectionRange(len, len)
        found.click()
        clearPendingInsert()
      }
    }

    // Wait a frame so the AI panel has mounted the input.
    const t = window.setTimeout(() => requestAnimationFrame(run), 50)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [
    pendingInsertId,
    targets,
    mentionIds,
    onChange,
    clearPendingInsert,
  ])

  return (
    <form
      className={cn("shrink-0 px-4 pb-4 pt-1", className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) onSubmit()
      }}
    >
      {/* Attachments = Lexical selection AI only (not @ mentions). */}
      {attachmentData.length > 0 && (
        <Attachments variant="inline" className="mb-2 justify-start gap-1.5">
          {attachmentData.map(({ attachment, data, preview }) => (
            <Attachment
              key={attachment.id}
              data={data}
              onRemove={() => removeAttachment(attachment.id)}
              className="max-w-full"
            >
              <AttachmentHoverCard>
                <AttachmentHoverCardTrigger>
                  <div className="flex max-w-[240px] items-center gap-1.5">
                    <AttachmentPreview />
                    <span className="truncate text-xs font-medium">
                      {preview}
                    </span>
                  </div>
                </AttachmentHoverCardTrigger>
                <AttachmentHoverCardContent className="max-w-xs">
                  <p className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {attachment.text}
                  </p>
                </AttachmentHoverCardContent>
              </AttachmentHoverCard>
              <AttachmentRemove label={t(`${i18nNs}:ai.attachment.remove`)} />
            </Attachment>
          ))}
        </Attachments>
      )}

      <Mention
        ref={rootRef}
        className="relative w-full"
        trigger="@"
        inputValue={displayValue}
        onInputValueChange={(next) => {
          setInterim("")
          onChange(next)
          valueRef.current = next
        }}
        value={mentionValue}
        onValueChange={setMentionIds}
        onFilter={onFilter}
        disabled={isBusy}
      >
        {/* Ask-like shell: multi-line field, top-aligned, actions bottom-right. */}
        <div className="relative rounded-2xl border border-border bg-muted/40 focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/15">
          <MentionInput
            asChild
            placeholder={
              isListening
                ? t(`${i18nNs}:ai.speech.placeholderListening`)
                : t(`${i18nNs}:ai.placeholder`)
            }
            disabled={isBusy}
            className="min-h-[88px] max-h-48 w-full resize-none border-0 bg-transparent px-4 py-4 pr-24 text-left text-sm leading-relaxed text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-hidden dark:bg-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // Let the open mention menu consume Enter.
                const menuOpen = document.querySelector(
                  '[data-slot="mention-content"][data-state="open"]'
                )
                if (menuOpen) return
                e.preventDefault()
                if (canSend) onSubmit()
              }
            }}
          >
            <textarea rows={3} />
          </MentionInput>

          <div className="absolute right-2.5 bottom-2.5 z-10 flex items-center gap-1.5">
            <SpeechInput
              type="button"
              size="icon-sm"
              lang={speechLang}
              disabled={isBusy}
              aria-label={
                isListening
                  ? t(`${i18nNs}:ai.speech.stopListening`)
                  : t(`${i18nNs}:ai.speech.startListening`)
              }
              className={cn(
                "size-8",
                !isListening &&
                  "bg-muted text-foreground hover:bg-muted/80 hover:text-foreground"
              )}
              onTranscriptionChange={handleFinalTranscript}
              onInterimChange={setInterim}
              onListeningChange={setIsListening}
            />
            {isBusy ? (
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="size-8 cursor-pointer rounded-full bg-muted text-foreground hover:bg-muted"
                aria-label={t(`${i18nNs}:ai.stop`)}
                onClick={() => onStop?.()}
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon-sm"
                disabled={!canSend}
                className="size-8 cursor-pointer rounded-full"
                aria-label={t(`${i18nNs}:ai.send`)}
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <MentionContent className="max-h-60 overflow-auto">
          {targets.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {t(`${i18nNs}:ai.mention.empty`)}
            </div>
          ) : (
            targets.map((target) => (
              <MentionItem
                key={target.id}
                value={target.id}
                label={target.label}
                data-mention-id={target.id}
              >
                <span className="min-w-0 flex-1 truncate">{target.label}</span>
                <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {target.kind.split(":")[0]}
                </span>
              </MentionItem>
            ))
          )}
        </MentionContent>
      </Mention>
    </form>
  )
}
