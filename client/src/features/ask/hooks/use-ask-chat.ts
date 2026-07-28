import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DefaultChatTransport } from "ai"
import { useAssistantChat } from "@mockmatch/ai-chat"
import { WELCOME_MESSAGE_ID } from "../constants"
import { useAskPanel } from "../ask-context"

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000"
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

  return useAssistantChat({
    chatId: `ask-${chatResetKey}`,
    transport,
    welcomeId: WELCOME_MESSAGE_ID,
    greeting,
  })
}

export type UseAskChatReturn = ReturnType<typeof useAskChat>
