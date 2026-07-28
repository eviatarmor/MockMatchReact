import { useTranslation } from "react-i18next"
import type { UIMessage } from "ai"
import { AssistantMessages } from "@mockmatch/ai-chat"
import { WELCOME_MESSAGE_ID } from "../constants"

type AskMessagesProps = {
  readonly messages: UIMessage[]
  readonly status: "submitted" | "streaming" | "ready" | "error"
  readonly error?: Error
}

export function AskMessages({ messages, status, error }: AskMessagesProps) {
  const { t } = useTranslation("ask")

  return (
    <AssistantMessages
      messages={messages}
      status={status}
      error={error}
      welcomeId={WELCOME_MESSAGE_ID}
      chrome="sidebar"
      thinkingLabel={t("thinkingPlaceholder")}
      errorLabel={t("errorGeneric")}
    />
  )
}
