import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useDocumentAssistant } from "../document-assistant-context"
import { useDocumentAssistantChat } from "../hooks/use-document-assistant-chat"
import { buildCoverLetterMentionTargets } from "../lib/mention-targets-cover-letter"
import { buildResumeMentionTargets } from "../lib/mention-targets-resume"
import type { CoverLetterDocument } from "@/features/cover-letter-editor/types"
import type { ResumeDocument } from "@/features/resume-editor/types"
import type { MentionTarget } from "../types"
import { AssistantInput } from "./assistant-input"
import { AssistantMessages } from "./assistant-messages"
import { AssistantSuggestions } from "./assistant-suggestions"

function useMentionTargets(): MentionTarget[] {
  const { t } = useTranslation()
  const { kind, document, i18nNs } = useDocumentAssistant()

  return useMemo(() => {
    if (kind === "resume") {
      const doc = document as ResumeDocument
      return buildResumeMentionTargets(
        doc,
        (type) => t(`${i18nNs}:sections.${type}`),
        t(`${i18nNs}:ai.mention.header`)
      )
    }
    const doc = document as CoverLetterDocument
    return buildCoverLetterMentionTargets(doc, {
      sender: t(`${i18nNs}:ai.mention.sender`),
      recipient: t(`${i18nNs}:ai.mention.recipient`),
      labelForType: (type) => t(`${i18nNs}:blocks.${type}`),
    })
  }, [kind, document, i18nNs, t])
}

/**
 * Full-height chat column for the editor AI rail / mobile sheet.
 * Parent should give a flex column with min-h-0 height.
 */
export function AssistantPanel() {
  const { i18nNs, chatResetKey } = useDocumentAssistant()
  const targets = useMentionTargets()
  const {
    messages,
    status,
    error,
    input,
    setInput,
    isBusy,
    sendText,
    handleSubmit,
    showSuggestions,
    stop,
    approveReplace,
    rejectReplace,
  } = useDocumentAssistantChat(targets)

  const inputResetKey = `${chatResetKey}:${messages.length}`

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
        value={input}
        onChange={setInput}
        onSubmit={() => void handleSubmit()}
        onStop={() => void stop()}
        isBusy={isBusy}
        targets={targets}
        resetKey={inputResetKey}
      />
    </div>
  )
}
