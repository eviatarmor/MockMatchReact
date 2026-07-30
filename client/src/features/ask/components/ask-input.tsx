import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUp, Square } from "lucide-react"
import { appendTranscript, type AssistantChrome } from "@mockmatch/ai-chat"
import { SpeechInput } from "@mockmatch/ai-chat/ai-elements/speech-input"
import { Button } from "@mockmatch/ui/button"
import { Textarea } from "@mockmatch/ui/textarea"
import { cn } from "@/lib/utils"

type AskInputProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onSubmit: () => void
  readonly onStop?: () => void
  readonly isBusy: boolean
  /** Bumped on New chat / send so speech session state resets. */
  readonly resetKey?: string | number
  readonly chrome?: AssistantChrome
  readonly className?: string
}

export function AskInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isBusy,
  resetKey = 0,
  chrome = "sidebar",
  className,
}: AskInputProps) {
  const { t, i18n } = useTranslation("ask")
  const [interim, setInterim] = useState("")
  const [isListening, setIsListening] = useState(false)
  const isSidebar = chrome === "sidebar"

  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    setInterim("")
    setIsListening(false)
  }, [resetKey])

  // Final phrases commit into the controlled input value.
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

  // Live interim shows in the same field but is not committed until final.
  const displayValue =
    isListening && interim.trim()
      ? appendTranscript(value, interim)
      : value

  const canSend = value.trim().length > 0 && !isBusy
  const speechLang = i18n.language || "en-US"

  return (
    <form
      className={cn("shrink-0 px-4 pb-4 pt-1", className)}
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) onSubmit()
      }}
    >
      <div
        className={cn(
          "relative rounded-2xl border focus-within:ring-2",
          isSidebar
            ? "border-sidebar-border bg-sidebar-accent/40 focus-within:border-sidebar-foreground/30 focus-within:ring-sidebar-foreground/15"
            : "border-border bg-muted/40 focus-within:border-foreground/30 focus-within:ring-foreground/15"
        )}
      >
        <Textarea
          value={displayValue}
          onChange={(e) => {
            // Manual edit commits immediately and drops interim overlay.
            setInterim("")
            onChange(e.target.value)
            valueRef.current = e.target.value
          }}
          placeholder={
            isListening ? t("speech.placeholderListening") : t("placeholder")
          }
          rows={3}
          className={cn(
            "min-h-[88px] max-h-48 resize-none border-0 bg-transparent px-4 py-4 pr-24 text-sm leading-relaxed shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent",
            isSidebar
              ? "text-sidebar-foreground placeholder:text-sidebar-foreground/45"
              : "text-foreground placeholder:text-muted-foreground"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (canSend) onSubmit()
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
                ? t("speech.stopListening")
                : t("speech.startListening")
            }
            className={cn(
              "size-8",
              !isListening &&
                (isSidebar
                  ? "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80 hover:text-foreground")
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
              className={cn(
                "size-8 cursor-pointer rounded-full",
                isSidebar
                  ? "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent"
                  : "bg-muted text-foreground hover:bg-muted"
              )}
              aria-label={t("stop")}
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
              aria-label={t("send")}
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
