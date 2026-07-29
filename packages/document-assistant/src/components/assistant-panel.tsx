import { useCallback } from "react"
import { useDocumentAssistant } from "../document-assistant-context"
import { useDocumentAssistantChat } from "../hooks/use-document-assistant-chat"
import { AssistantInput } from "./assistant-input"
import { AssistantMessages } from "./assistant-messages"
import { AssistantSuggestions } from "./assistant-suggestions"

/**
 * Full-height chat column for the editor AI rail / mobile sheet.
 * Parent should give a flex column with min-h-0 height.
 */
export function AssistantPanel() {
  const { i18nNs, chatResetKey } = useDocumentAssistant()
  const {
    messages,
    status,
    error,
    isBusy,
    sendText,
    showSuggestions,
    stop,
    approveReplace,
    rejectReplace,
  } = useDocumentAssistantChat()

  const inputResetKey = `${chatResetKey}:${messages.length}`

  const handleSubmit = useCallback(
    (text: string) => {
      void sendText(text)
    },
    [sendText]
  )

  const handleStop = useCallback(() => {
    void stop()
  }, [stop])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AssistantMessages
        messages={messages}
        status={status}
        error={error}
        i18nNs={i18nNs}
        onApproveReplace={approveReplace}
        onRejectReplace={rejectReplace}
      />

      {showSuggestions && (
        <AssistantSuggestions
          i18nNs={i18nNs}
          onSelect={sendText}
          disabled={isBusy}
        />
      )}

      <AssistantInput
        onSubmit={handleSubmit}
        onStop={handleStop}
        isBusy={isBusy}
        resetKey={inputResetKey}
      />
    </div>
  )
}
