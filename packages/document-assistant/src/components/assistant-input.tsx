import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUp, Square, TextSelect } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { SourceDocumentUIPart } from "ai"
import { appendTranscript } from "@mockmatch/ai-chat"
import { SpeechInput } from "@mockmatch/ai-chat/ai-elements/speech-input"
import {
  Attachment,
  AttachmentHoverCard,
  AttachmentHoverCardContent,
  AttachmentHoverCardTrigger,
  AttachmentRemove,
  Attachments,
} from "@mockmatch/ai-chat/ai-elements/attachments"
import { Button } from "@mockmatch/ui/button"
import { Textarea } from "@mockmatch/ui/textarea"
import { cn } from "@mockmatch/ui/utils"
import { useDocumentAssistant } from "../document-assistant-context"

type AssistantInputProps = {
  readonly onSubmit: (text: string) => void
  readonly onStop?: () => void
  readonly isBusy: boolean
  readonly resetKey?: string | number
  readonly className?: string
}

function truncateAttachmentText(text: string, max = 72): string {
  const oneLine = text.replace(/\s+/g, " ").trim()
  if (oneLine.length <= max) return oneLine
  return `${oneLine.slice(0, max - 1)}…`
}

function resolveAttachmentIcon(attachment: {
  icon?: LucideIcon
}): LucideIcon {
  return attachment.icon ?? TextSelect
}

/**
 * Document AI composer — plain textarea + selection/section attachments.
 * @ mentions removed.
 */
export const AssistantInput = memo(function AssistantInput({
  onSubmit,
  onStop,
  isBusy,
  resetKey = 0,
  className,
}: AssistantInputProps) {
  const { t, i18n } = useTranslation()
  const { i18nNs, attachments, removeAttachment } = useDocumentAssistant()

  const [value, setValue] = useState("")
  const [interim, setInterim] = useState("")
  const [isListening, setIsListening] = useState(false)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    setValue("")
    setInterim("")
    setIsListening(false)
    valueRef.current = ""
  }, [resetKey])

  const handleFinalTranscript = useCallback((text: string) => {
    const piece = text.trim()
    if (!piece) return
    const next = appendTranscript(valueRef.current, piece)
    valueRef.current = next
    setValue(next)
    setInterim("")
  }, [])

  const displayValue =
    isListening && interim.trim()
      ? appendTranscript(value, interim)
      : value

  const canSend = value.trim().length > 0 && !isBusy
  const speechLang = i18n.language || "en-US"

  const attachmentData = useMemo(
    () =>
      attachments.map((a) => {
        const isSelection = a.targetId == null
        const Icon = resolveAttachmentIcon(a)
        const title = isSelection
          ? truncateAttachmentText(a.text)
          : a.title
        const data: SourceDocumentUIPart & { id: string } = {
          id: a.id,
          type: "source-document",
          sourceId: a.id,
          mediaType: "text/plain",
          title,
          filename: "selection.txt",
        }
        return {
          attachment: a,
          data,
          Icon,
          isSelection,
          groupLabel: a.groupLabel,
          primaryLabel: a.primaryLabel,
          title,
          previewText: truncateAttachmentText(a.text),
        }
      }),
    [attachments]
  )

  const submit = useCallback(() => {
    const text = value.trim()
    if (!text || isBusy) return
    setValue("")
    valueRef.current = ""
    setInterim("")
    onSubmit(text)
  }, [value, isBusy, onSubmit])

  return (
    <form
      className={cn("shrink-0 px-4 pb-4 pt-1", className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) submit()
      }}
    >
      {attachmentData.length > 0 && (
        <Attachments
          variant="inline"
          className="mb-2 w-full flex-wrap gap-1.5"
        >
          {attachmentData.map(
            ({
              attachment,
              data,
              Icon,
              isSelection,
              groupLabel,
              primaryLabel,
              title,
              previewText,
            }) => (
              <Attachment
                key={attachment.id}
                data={data}
                onRemove={() => removeAttachment(attachment.id)}
                className="min-w-0 max-w-full flex-[1_1_calc(50%-0.375rem)] justify-between"
              >
                <AttachmentHoverCard>
                  <AttachmentHoverCardTrigger>
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-background">
                        <Icon
                          className="size-3 text-muted-foreground"
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        {isSelection ? (
                          <span className="text-foreground">{previewText}</span>
                        ) : groupLabel ? (
                          <>
                            <span className="text-muted-foreground">
                              {groupLabel}
                            </span>
                            <span className="text-muted-foreground"> / </span>
                            <span className="text-foreground">
                              {primaryLabel}
                            </span>
                          </>
                        ) : (
                          <span className="text-foreground">{title}</span>
                        )}
                      </span>
                    </div>
                  </AttachmentHoverCardTrigger>
                  <AttachmentHoverCardContent className="max-w-xs">
                    {!isSelection && (
                      <p className="mb-1 text-xs font-medium text-foreground">
                        {title}
                      </p>
                    )}
                    <p className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                      {attachment.text}
                    </p>
                  </AttachmentHoverCardContent>
                </AttachmentHoverCard>
                <AttachmentRemove
                  label={t(`${i18nNs}:ai.attachment.remove`)}
                />
              </Attachment>
            )
          )}
        </Attachments>
      )}

      <div className="relative rounded-2xl border border-border bg-muted/40 focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/15">
        <Textarea
          value={displayValue}
          onChange={(e) => {
            setInterim("")
            setValue(e.target.value)
            valueRef.current = e.target.value
          }}
          placeholder={
            isListening
              ? t(`${i18nNs}:ai.speech.placeholderListening`)
              : t(`${i18nNs}:ai.placeholder`)
          }
          rows={3}
          disabled={isBusy}
          className="min-h-[88px] max-h-48 resize-none border-0 bg-transparent px-4 py-4 pr-24 text-sm leading-relaxed text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (canSend) submit()
            }
          }}
        />
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
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
    </form>
  )
})
