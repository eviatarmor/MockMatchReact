import { useCallback, useEffect, useState } from "react"
import { useChat } from "@ai-sdk/react"
import type { UIMessage, ChatTransport, ChatInit } from "ai"

export function createWelcomeMessage(
  id: string,
  text: string
): UIMessage {
  return {
    id,
    role: "assistant",
    parts: [{ type: "text", text }],
  }
}

export type UseAssistantChatOptions = {
  /** Stable chat id (include reset key so New chat remounts). */
  readonly chatId: string
  readonly transport: ChatTransport<UIMessage>
  readonly welcomeId: string
  readonly greeting: string
  /** Extra `useChat` options (e.g. sendAutomaticallyWhen for tool approvals). */
  readonly chatInit?: Omit<
    ChatInit<UIMessage>,
    "id" | "transport" | "messages"
  >
}

/**
 * Shared chat shell: welcome message, draft input, busy flag, send helpers.
 * Product adapters supply transport + optional tool-approval behavior.
 */
export function useAssistantChat({
  chatId,
  transport,
  welcomeId,
  greeting,
  chatInit,
}: UseAssistantChatOptions) {
  const chat = useChat({
    id: chatId,
    transport,
    messages: [createWelcomeMessage(welcomeId, greeting)],
    ...chatInit,
  })

  const [input, setInput] = useState("")

  // Extract reset key from chatId suffix pattern `*-${n}` is caller-owned;
  // reset draft when the whole chatId changes (New chat).
  useEffect(() => {
    setInput("")
  }, [chatId])

  // Keep welcome text in sync if locale changes while only welcome is shown.
  useEffect(() => {
    if (
      chat.messages.length === 1 &&
      chat.messages[0]?.id === welcomeId
    ) {
      chat.setMessages([createWelcomeMessage(welcomeId, greeting)])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional greeting sync
  }, [greeting, welcomeId])

  const isBusy =
    chat.status === "submitted" || chat.status === "streaming"

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isBusy) return
      setInput("")
      await chat.sendMessage({ text: trimmed })
    },
    [chat, isBusy]
  )

  const handleSubmit = useCallback(
    async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.()
      await sendText(input)
    },
    [input, sendText]
  )

  const showSuggestions =
    chat.messages.length === 1 &&
    chat.messages[0]?.id === welcomeId &&
    !isBusy

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    input,
    setInput,
    isBusy,
    sendText,
    handleSubmit,
    showSuggestions,
    stop: chat.stop,
    addToolApprovalResponse: chat.addToolApprovalResponse,
    setMessages: chat.setMessages,
  }
}

export type UseAssistantChatReturn = ReturnType<typeof useAssistantChat>
