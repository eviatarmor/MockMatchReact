import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowUp, Square } from "lucide-react"
import { appendTranscript } from "@mockmatch/ai-chat"
import { SpeechInput } from "@mockmatch/ai-chat/ai-elements/speech-input"
import { Button } from "@mockmatch/ui/button"
import { Textarea } from "@mockmatch/ui/textarea"
import { cn } from "@mockmatch/ui/utils"
import type { ConversationInputLabels } from "./types"

export type ConversationInputProps = {
  readonly disabled?: boolean
  readonly isBusy?: boolean
  readonly resetKey?: string | number
  readonly lang?: string
  readonly onSend: (text: string) => boolean | void
  readonly onListeningChange?: (listening: boolean) => void
  readonly onStop?: () => void
  readonly labels: ConversationInputLabels
  readonly className?: string
}

export function ConversationInput({
  disabled = false,
  isBusy = false,
  resetKey = 0,
  lang = "en-US",
  onSend,
  onListeningChange,
  onStop,
  labels,
  className,
}: ConversationInputProps) {
  const [value, setValue] = useState("")
  const [interim, setInterim] = useState("")
  const [isListening, setIsListening] = useState(false)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    setValue("")
    setInterim("")
    setIsListening(false)
  }, [resetKey])

  useEffect(() => {
    onListeningChange?.(isListening)
  }, [isListening, onListeningChange])

  const handleFinalTranscript = useCallback((text: string) => {
    const piece = text.trim()
    if (!piece) return
    const nextValue = appendTranscript(valueRef.current, piece)
    valueRef.current = nextValue
    setValue(nextValue)
    setInterim("")
  }, [])

  const displayValue =
    isListening && interim.trim()
      ? appendTranscript(value, interim)
      : value

  const canSend = value.trim().length > 0 && !isBusy && !disabled

  const submit = () => {
    if (!canSend) return
    const sent = onSend(value)
    if (sent !== false) {
      setValue("")
      valueRef.current = ""
      setInterim("")
    }
  }

  return (
    <form
      className={cn("shrink-0 border-t border-border px-3 pb-3 pt-2", className)}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="relative rounded-2xl border border-border bg-muted/40 focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/15">
        <Textarea
          value={displayValue}
          disabled={disabled}
          onChange={(e) => {
            setInterim("")
            setValue(e.target.value)
            valueRef.current = e.target.value
          }}
          placeholder={
            isListening ? labels.placeholderListening : labels.placeholder
          }
          rows={3}
          className="min-h-[88px] max-h-48 resize-none border-0 bg-transparent px-4 py-4 pr-24 text-sm leading-relaxed text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
          <SpeechInput
            type="button"
            size="icon-sm"
            lang={lang}
            disabled={disabled || isBusy}
            aria-label={
              isListening ? labels.stopListening : labels.startListening
            }
            className="size-8 bg-muted text-foreground hover:bg-muted/80"
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
              aria-label={labels.stop}
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
              aria-label={labels.send}
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
