import { useEffect, useRef, type ReactNode } from "react"
import type { UIMessage } from "ai"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "../ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning"
import { ScrollArea } from "@mockmatch/ui/scroll-area"
import { cn } from "@mockmatch/ui/utils"
import {
  ASSISTANT_USER_TEXT_CLASS,
  type AssistantChrome,
  assistantTextClass,
} from "./text-class"

export type AssistantMessagesProps = {
  readonly messages: UIMessage[]
  readonly status: "submitted" | "streaming" | "ready" | "error"
  readonly error?: Error
  readonly welcomeId: string
  readonly chrome?: AssistantChrome
  readonly thinkingLabel: string
  readonly errorLabel: string
  /**
   * Extra parts (tools, etc.). Return null to skip.
   * Text/reasoning always handled by the shell.
   */
  readonly renderPart?: (
    part: UIMessage["parts"][number],
    ctx: { message: UIMessage; index: number; isLastMessage: boolean }
  ) => ReactNode
  /** When true, suppress synthetic thinking if last message has tool parts. */
  readonly hasBlockingToolParts?: (message: UIMessage) => boolean
}

type ChromeTokens = {
  userBubble: string
  reasoning: string
  reasoningTrigger: string
  reasoningContent: string
  reasoningPlaceholder: string
  error: string
}

function chromeTokens(chrome: AssistantChrome): ChromeTokens {
  if (chrome === "sidebar") {
    return {
      userBubble:
        "group-[.is-user]:bg-sidebar-accent group-[.is-user]:text-sidebar-foreground",
      reasoning: "w-full text-sidebar-foreground/70",
      reasoningTrigger:
        "text-sidebar-foreground/70 hover:text-sidebar-foreground",
      reasoningContent: "text-sidebar-foreground/60",
      reasoningPlaceholder: "text-sidebar-foreground/60",
      error: "text-sm text-red-400",
    }
  }
  return {
    userBubble: "group-[.is-user]:bg-muted group-[.is-user]:text-foreground",
    reasoning: "w-full text-muted-foreground",
    reasoningTrigger: "text-muted-foreground hover:text-foreground",
    reasoningContent: "text-muted-foreground/60",
    reasoningPlaceholder: "text-muted-foreground/80",
    error: "text-sm text-destructive",
  }
}

function MessageParts({
  message,
  isLastMessage,
  isStreaming,
  textClass,
  tokens,
  renderPart,
}: {
  message: UIMessage
  isLastMessage: boolean
  isStreaming: boolean
  textClass: string
  tokens: ChromeTokens
  renderPart?: AssistantMessagesProps["renderPart"]
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
          className={tokens.reasoning}
          isStreaming={isReasoningStreaming}
        >
          <ReasoningTrigger className={tokens.reasoningTrigger} />
          <ReasoningContent className={tokens.reasoningContent}>
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
                className={ASSISTANT_USER_TEXT_CLASS}
              >
                {part.text}
              </p>
            )
          }
          return (
            <MessageResponse
              key={`${message.id}-text-${i}`}
              className={textClass}
              isAnimating={isLastMessage && isStreaming}
            >
              {part.text}
            </MessageResponse>
          )
        }

        if (part.type === "reasoning") return null

        const extra = renderPart?.(part, {
          message,
          index: i,
          isLastMessage,
        })
        return extra ?? null
      })}
    </>
  )
}

export function AssistantMessages({
  messages,
  status,
  error,
  welcomeId,
  chrome = "surface",
  thinkingLabel,
  errorLabel,
  renderPart,
  hasBlockingToolParts,
}: AssistantMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const isStreaming = status === "streaming"
  const isSubmitted = status === "submitted"
  const tokens = chromeTokens(chrome)
  const textClass = assistantTextClass(chrome)

  const lastMessage = messages.at(-1)
  const lastHasText =
    lastMessage?.parts.some(
      (p) => p.type === "text" && p.text.trim().length > 0
    ) ?? false
  const lastHasReasoning = lastMessage?.parts.some(
    (p) => p.type === "reasoning"
  )
  const lastHasTool =
    lastMessage != null && (hasBlockingToolParts?.(lastMessage) ?? false)

  const showSyntheticThinking =
    (isSubmitted || isStreaming) &&
    lastMessage?.role === "assistant" &&
    !lastHasText &&
    !lastHasReasoning &&
    !lastHasTool

  const showPendingThinking =
    isSubmitted && lastMessage?.role === "user"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages, status])

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div
        className={cn(
          "flex flex-col gap-5 px-4",
          chrome === "sidebar" ? "py-5" : "py-4"
        )}
      >
        {messages.map((message, index) => (
          <Message
            from={message.role}
            key={message.id}
            className={cn(message.id === welcomeId && "max-w-full")}
          >
            <MessageContent
              className={cn(
                tokens.userBubble,
                message.role === "assistant" && "w-full max-w-full"
              )}
            >
              <MessageParts
                message={message}
                isLastMessage={index === messages.length - 1}
                isStreaming={isStreaming}
                textClass={textClass}
                tokens={tokens}
                renderPart={renderPart}
              />
            </MessageContent>
          </Message>
        ))}

        {(showSyntheticThinking || showPendingThinking) && (
          <Message from="assistant">
            <MessageContent className="w-full max-w-full">
              <Reasoning
                className={tokens.reasoning}
                isStreaming
                defaultOpen
              >
                <ReasoningTrigger className={tokens.reasoningTrigger} />
                <ReasoningContent className={tokens.reasoningPlaceholder}>
                  {thinkingLabel}
                </ReasoningContent>
              </Reasoning>
            </MessageContent>
          </Message>
        )}

        {status === "error" && error && (
          <p className={tokens.error}>{errorLabel}</p>
        )}

        <div ref={bottomRef} aria-hidden className="h-px w-full shrink-0" />
      </div>
    </ScrollArea>
  )
}
