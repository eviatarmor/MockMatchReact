import { useCallback, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai"
import { useAssistantChat } from "@mockmatch/ai-chat"
import { DOCUMENT_AI_WELCOME_ID } from "../constants"
import { useDocumentAssistant } from "../document-assistant-context"
import type { TextAttachment } from "../types"

function getApiBaseUrl(): string {
  // Vite host injects VITE_API_URL; non-Vite hosts can set via globalThis.
  const env = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } })
    .env
  return env?.VITE_API_URL ?? "http://localhost:3000"
}

function attachmentsForApi(attachments: readonly TextAttachment[]) {
  return attachments.map((a) => ({
    id: a.id,
    title: a.title,
    text: a.text,
  }))
}

export function useDocumentAssistantChat() {
  const { t } = useTranslation()
  const { kind, document, i18nNs, chatResetKey, attachments } =
    useDocumentAssistant()

  const greeting = t(`${i18nNs}:ai.greeting`)

  const contextRef = useRef({
    kind,
    document,
    attachments,
  })
  contextRef.current = {
    kind,
    document,
    attachments,
  }

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${getApiBaseUrl()}/document-ai/chat`,
        credentials: "include",
        prepareSendMessagesRequest: ({ messages, id, body }) => {
          const ctx = contextRef.current
          return {
            body: {
              ...body,
              id,
              messages,
              kind: ctx.kind,
              document: ctx.document,
              attachments: attachmentsForApi(ctx.attachments),
            },
          }
        },
      }),
    []
  )

  const {
    messages,
    status,
    error,
    isBusy,
    sendText,
    showSuggestions: baseShowSuggestions,
    stop,
    addToolApprovalResponse,
  } = useAssistantChat({
    chatId: `document-ai-${kind}-${chatResetKey}`,
    transport,
    welcomeId: DOCUMENT_AI_WELCOME_ID,
    greeting,
    chatInit: {
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    },
  })

  const approveReplace = useCallback(
    (approvalId: string) => {
      void addToolApprovalResponse({
        id: approvalId,
        approved: true,
      })
    },
    [addToolApprovalResponse]
  )

  const rejectReplace = useCallback(
    (approvalId: string) => {
      void addToolApprovalResponse({
        id: approvalId,
        approved: false,
        reason: "User rejected the replacement",
      })
    },
    [addToolApprovalResponse]
  )

  const showSuggestions =
    baseShowSuggestions && attachments.length === 0

  return {
    messages,
    status,
    error,
    isBusy,
    sendText,
    showSuggestions,
    stop,
    approveReplace,
    rejectReplace,
  }
}

export type UseDocumentAssistantChatReturn = ReturnType<
  typeof useDocumentAssistantChat
>
