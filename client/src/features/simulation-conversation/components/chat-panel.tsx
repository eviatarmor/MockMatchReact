import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  Transcription,
  TranscriptionSegment,
} from "@mockmatch/ai-chat/ai-elements/transcription"
import { ScrollArea } from "@mockmatch/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { TranscriptTurn } from "../types"
import { ConversationInput } from "./conversation-input"

interface ChatPanelProps {
  readonly turns: readonly TranscriptTurn[]
  readonly liveTurnId: string | null
  readonly playbackTime: number
  readonly canSend: boolean
  readonly isBusy: boolean
  readonly phaseEnded: boolean
  readonly inputResetKey: string | number
  readonly onSend: (text: string) => boolean | void
  readonly onListeningChange: (listening: boolean) => void
  readonly className?: string
}

export function ChatPanel({
  turns,
  liveTurnId,
  playbackTime,
  canSend,
  isBusy,
  phaseEnded,
  inputResetKey,
  onSend,
  onListeningChange,
  className,
}: ChatPanelProps) {
  const { t } = useTranslation("simulation-conversation")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [turns.length, liveTurnId, playbackTime])

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-background",
        className
      )}
      aria-label={t("chat.title")}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-4">
          {turns.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("chat.empty")}</p>
          ) : (
            turns.map((turn) => {
              const isLive = turn.id === liveTurnId
              const currentTime = isLive
                ? playbackTime
                : turn.durationSec + 0.01

              return (
                <div
                  key={turn.id}
                  className={cn(
                    "flex w-full",
                    turn.role === "user" && "justify-end",
                    turn.role === "agent" && "justify-start",
                    turn.role === "system" && "justify-center"
                  )}
                >
                  <div
                    className={cn(
                      "flex max-w-[92%] flex-col gap-1 rounded-2xl px-3.5 py-2.5 sm:max-w-[85%]",
                      turn.role === "agent" && "bg-muted text-foreground",
                      turn.role === "user" &&
                        "bg-primary text-primary-foreground",
                      turn.role === "system" &&
                        "max-w-full border border-dashed border-border/60 bg-transparent px-3 py-1.5 text-muted-foreground"
                    )}
                  >
                    {turn.role !== "system" ? (
                      <span
                        className={cn(
                          "text-2xs font-semibold uppercase tracking-wide",
                          turn.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {t(`chat.role.${turn.role}`)}
                      </span>
                    ) : null}

                    {turn.role === "system" || turn.segments.length === 0 ? (
                      <p className="text-sm leading-relaxed">{turn.text}</p>
                    ) : turn.role === "user" ? (
                      <p className="text-sm leading-relaxed">{turn.text}</p>
                    ) : (
                      <Transcription
                        segments={[...turn.segments]}
                        currentTime={currentTime}
                        className="text-sm leading-relaxed"
                      >
                        {(segment, index) => (
                          <TranscriptionSegment
                            key={`${turn.id}-${index}`}
                            segment={segment}
                            index={index}
                            className={cn(
                              isLive && "transition-colors duration-100",
                              // On primary-colored bubble we only use for agent (muted bg)
                              !isLive && "text-foreground",
                              isLive &&
                                "data-[active=true]:text-primary data-[active=false]:text-muted-foreground"
                            )}
                          />
                        )}
                      </Transcription>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {!phaseEnded ? (
        <ConversationInput
          disabled={!canSend && !isBusy}
          isBusy={isBusy}
          resetKey={inputResetKey}
          onSend={onSend}
          onListeningChange={onListeningChange}
        />
      ) : null}
    </div>
  )
}
