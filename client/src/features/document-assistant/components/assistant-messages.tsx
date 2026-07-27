import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { UIMessage } from "ai"
import { AssistantMessages as SharedAssistantMessages } from "@/components/assistant"
import { DOCUMENT_AI_WELCOME_ID } from "../constants"
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

export function AssistantMessages({
  messages,
  status,
  error,
  i18nNs,
  onApproveReplace,
  onRejectReplace,
}: AssistantMessagesProps) {
  const { t } = useTranslation(i18nNs)

  const renderPart = useCallback(
    (part: UIMessage["parts"][number]) => {
      if (!isReplaceDocumentTextPart(part)) return null
      return (
        <ReplaceConfirmation
          key={`tool-${part.toolCallId}`}
          part={part}
          onApprove={onApproveReplace}
          onReject={onRejectReplace}
        />
      )
    },
    [onApproveReplace, onRejectReplace]
  )

  const hasBlockingToolParts = useCallback(
    (message: UIMessage) => message.parts.some(isReplaceDocumentTextPart),
    []
  )

  return (
    <SharedAssistantMessages
      messages={messages}
      status={status}
      error={error}
      welcomeId={DOCUMENT_AI_WELCOME_ID}
      chrome="surface"
      thinkingLabel={t("ai.thinkingPlaceholder")}
      errorLabel={t("ai.errorGeneric")}
      renderPart={renderPart}
      hasBlockingToolParts={hasBlockingToolParts}
    />
  )
}
