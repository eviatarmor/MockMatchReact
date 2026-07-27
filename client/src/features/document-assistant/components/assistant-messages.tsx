import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { UIMessage } from "ai"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  DOCUMENT_AI_ASSISTANT_TEXT_CLASS,
  DOCUMENT_AI_WELCOME_ID,
} from "../constants"
import { isReplaceDocumentTextPart } from "../lib/replace-tool"
import { ReplaceConfirmation } from "./replace-confirmation"

type AssistantMessagesProps = {
  readonly messages: UIMessage[]
  readonly status: "submitted" | "streaming" | "ready" | "error"
  readonly error?: Error
  readonly i18nNs: string
  readonly onApproveReplace: (approvalId: string) => void
  readonly onRejectReplace: (approvalId: string) => void
}

function MessageParts({
  message,
  isLastMessage,
  isStreaming,
  onApproveReplace,
  onRejectReplace,
}: {
  message: UIMessage
  isLastMessage: boolean
  isStreaming: boolean
  onApproveReplace: (approvalId: string) => void
  onRejectReplace: (approvalId: string) => void
}) {
  const reasoningParts = message.parts.filter((part) => part.type === "reasoning")
  const reasoningText = reasoningParts
    .map((part) => (part.type === "reasoning" ? part.text : ""))
    .join("\n\n")
  const hasReasoning = reasoningParts.length > 0

  const lastPart = message.parts.at(-1)
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning"

  const isUser = message.role === "user"

  return (
    <>
      {hasReasoning && (
        <Reasoning
          className="w-full text-muted-foreground"
          isStreaming={isReasoningStreaming}
        >
          <ReasoningTrigger className="text-muted-foreground hover:text-foreground" />
          <ReasoningContent className="text-muted-foreground/60">
            {reasoningText}
          </ReasoningContent>
        </Reasoning>
      )}
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          if (isUser) {
            return (
              <p
                key={`${message.id}-text-${i}`}
                className="text-[15px] leading-relaxed whitespace-pre-wrap"
              >
                {part.text}
              </p>
            )
          }
          // Render GFM markdown (tables, lists, bold) via AI Elements Streamdown.
          return (
            <MessageResponse
              key={`${message.id}-text-${i}`}
              className={DOCUMENT_AI_ASSISTANT_TEXT_CLASS}
              isAnimating={isLastMessage && isStreaming}
            >
              {part.text}
            </MessageResponse>
          )
        }

        if (isReplaceDocumentTextPart(part)) {
          return (
            <ReplaceConfirmation
              key={`${message.id}-tool-${part.toolCallId}`}
              part={part}
              onApprove={onApproveReplace}
              onReject={onRejectReplace}
            />
          )
        }

        return null
      })}
    </>
  )
}

export function AssistantMessages({
  messages,
  status,
  error,
  i18nNs,
  onApproveReplace,
  onRejectReplace,
}: AssistantMessagesProps) {
  const { t } = useTranslation(i18nNs)
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
  const lastHasReplaceTool = lastMessage?.parts.some(isReplaceDocumentTextPart)
  const showSyntheticThinking =
    (isSubmitted || isStreaming) &&
    lastMessage?.role === "assistant" &&
    !lastHasText &&
    !lastHasReasoning &&
    !lastHasReplaceTool

  const showPendingThinking =
    isSubmitted && lastMessage?.role === "user"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages, status])

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-5 px-4 py-4">
        {messages.map((message, index) => (
          <Message
            from={message.role}
            key={message.id}
            className={cn(message.id === DOCUMENT_AI_WELCOME_ID && "max-w-full")}
          >
            <MessageContent
              className={cn(
                "group-[.is-user]:bg-muted group-[.is-user]:text-foreground",
                message.role === "assistant" && "w-full max-w-full"
              )}
            >
              <MessageParts
                message={message}
                isLastMessage={index === messages.length - 1}
                isStreaming={isStreaming}
                onApproveReplace={onApproveReplace}
                onRejectReplace={onRejectReplace}
              />
            </MessageContent>
          </Message>
        ))}

        {(showSyntheticThinking || showPendingThinking) && (
          <Message from="assistant">
            <MessageContent className="w-full max-w-full">
              <Reasoning
                className="w-full text-muted-foreground"
                isStreaming
                defaultOpen
              >
                <ReasoningTrigger className="text-muted-foreground hover:text-foreground" />
                <ReasoningContent className="text-muted-foreground/80">
                  {t("ai.thinkingPlaceholder")}
                </ReasoningContent>
              </Reasoning>
            </MessageContent>
          </Message>
        )}

        {status === "error" && error && (
          <p className="text-sm text-destructive">{t("ai.errorGeneric")}</p>
        )}

        <div ref={bottomRef} aria-hidden className="h-px w-full shrink-0" />
      </div>
    </ScrollArea>
  )
}
