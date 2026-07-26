import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { WELCOME_MESSAGE_ID } from "../constants"
import { useAskPanel } from "../ask-context"

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000"
}

function createWelcomeMessage(text: string): UIMessage {
  return {
    id: WELCOME_MESSAGE_ID,
    role: "assistant",
    parts: [{ type: "text", text }],
  }
}

export function useAskChat() {
  const { t } = useTranslation("ask")
  const { chatResetKey } = useAskPanel()
  const greeting = t("greeting")

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${getApiBaseUrl()}/ask/chat`,
        credentials: "include",
      }),
    []
  )

  const chat = useChat({
    id: `ask-${chatResetKey}`,
    transport,
    messages: [createWelcomeMessage(greeting)],
  })

  const [input, setInput] = useState("")

  // Reset local draft when starting a new chat.
  useEffect(() => {
    setInput("")
  }, [chatResetKey])

  // Keep welcome text in sync if locale changes while only welcome is shown.
  useEffect(() => {
    if (
      chat.messages.length === 1 &&
      chat.messages[0]?.id === WELCOME_MESSAGE_ID
    ) {
      chat.setMessages([createWelcomeMessage(greeting)])
    }
    // Only re-sync when greeting language changes, not on every message update.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [greeting])

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
    chat.messages[0]?.id === WELCOME_MESSAGE_ID &&
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
  }
}

export type UseAskChatReturn = ReturnType<typeof useAskChat>
