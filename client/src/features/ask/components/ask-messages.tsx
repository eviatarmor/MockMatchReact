import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { UIMessage } from "ai"
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ASK_ASSISTANT_TEXT_CLASS, WELCOME_MESSAGE_ID } from "../constants"

type AskMessagesProps = {
  readonly messages: UIMessage[]
  readonly status: "submitted" | "streaming" | "ready" | "error"
  readonly error?: Error
}

function MessageParts({
  message,
  isLastMessage,
  isStreaming,
}: {
  message: UIMessage
  isLastMessage: boolean
  isStreaming: boolean
}) {
  const reasoningParts = message.parts.filter((part) => part.type === "reasoning")
  const reasoningText = reasoningParts
    .map((part) => (part.type === "reasoning" ? part.text : ""))
    .join("\n\n")
  const hasReasoning = reasoningParts.length > 0

  const lastPart = message.parts.at(-1)
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning"

  const textParts = message.parts.filter((part) => part.type === "text")
  const isUser = message.role === "user"

  return (
    <>
      {hasReasoning && (
        <Reasoning
          className="w-full text-sidebar-foreground/70"
          isStreaming={isReasoningStreaming}
        >
          <ReasoningTrigger className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
          <ReasoningContent className="text-sidebar-foreground/60">
            {reasoningText}
          </ReasoningContent>
        </Reasoning>
      )}
      {textParts.map((part, i) => {
        if (part.type !== "text") return null
        if (isUser) {
          return (
            <p
              key={`${message.id}-${i}`}
              className="text-[15px] leading-relaxed whitespace-pre-wrap"
            >
              {part.text}
            </p>
          )
        }
        // Assistant (incl. welcome): same type style as the greeting line.
        return (
          <p key={`${message.id}-${i}`} className={ASK_ASSISTANT_TEXT_CLASS}>
            {part.text}
          </p>
        )
      })}
    </>
  )
}

export function AskMessages({ messages, status, error }: AskMessagesProps) {
  const { t } = useTranslation("ask")
  const bottomRef = useRef<HTMLDivElement>(null)
  const isStreaming = status === "streaming"
  const isSubmitted = status === "submitted"

  const lastMessage = messages.at(-1)
  const lastHasText =
    lastMessage?.parts.some(
      (p) => p.type === "text" && p.text.trim().length > 0
    ) ?? false
  const lastHasReasoning = lastMessage?.parts.some(
    (p) => p.type === "reasoning"
  )
  // Synthetic thinking while waiting for first tokens on free models.
  const showSyntheticThinking =
    (isSubmitted || isStreaming) &&
    lastMessage?.role === "assistant" &&
    !lastHasText &&
    !lastHasReasoning

  // Or when user just sent and assistant message not yet appended.
  const showPendingThinking =
    isSubmitted && lastMessage?.role === "user"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages, status])

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-5 px-4 py-5">
        {messages.map((message, index) => (
          <Message
            from={message.role}
            key={message.id}
            className={cn(message.id === WELCOME_MESSAGE_ID && "max-w-full")}
          >
            <MessageContent
              className={cn(
                "group-[.is-user]:bg-sidebar-accent group-[.is-user]:text-sidebar-foreground",
                message.role === "assistant" && "w-full max-w-full"
              )}
            >
              <MessageParts
                message={message}
                isLastMessage={index === messages.length - 1}
                isStreaming={isStreaming}
              />
            </MessageContent>
          </Message>
        ))}

        {(showSyntheticThinking || showPendingThinking) && (
          <Message from="assistant">
            <MessageContent className="w-full max-w-full">
              <Reasoning
                className="w-full text-sidebar-foreground/70"
                isStreaming
                defaultOpen
              >
                <ReasoningTrigger className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
                <ReasoningContent className="text-sidebar-foreground/60">
                  {t("thinkingPlaceholder")}
                </ReasoningContent>
              </Reasoning>
            </MessageContent>
          </Message>
        )}

        {status === "error" && error && (
          <p className="text-sm text-red-400">{t("errorGeneric")}</p>
        )}

        <div ref={bottomRef} aria-hidden className="h-px w-full shrink-0" />
      </div>
    </ScrollArea>
  )
}
