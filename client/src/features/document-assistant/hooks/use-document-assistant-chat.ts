import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useChat } from "@ai-sdk/react"
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai"
import { DOCUMENT_AI_WELCOME_ID } from "../constants"
import { useDocumentAssistant } from "../document-assistant-context"
import type { MentionTarget, TextAttachment } from "../types"

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000"
}

function createWelcomeMessage(text: string): UIMessage {
  return {
    id: DOCUMENT_AI_WELCOME_ID,
    role: "assistant",
    parts: [{ type: "text", text }],
  }
}

function resolveMentionsForApi(
  mentionIds: readonly string[],
  targets: readonly MentionTarget[]
) {
  const byId = new Map(targets.map((t) => [t.id, t]))
  return mentionIds
    .map((id) => {
      const t = byId.get(id)
      if (!t) return null
      return {
        id: t.id,
        label: t.label,
        kind: t.kind,
        context: t.getContext(),
      }
    })
    .filter((m): m is NonNullable<typeof m> => m != null)
}

function attachmentsForApi(attachments: readonly TextAttachment[]) {
  return attachments.map((a) => ({
    id: a.id,
    title: a.title,
    text: a.text,
  }))
}

export function useDocumentAssistantChat(targets: readonly MentionTarget[]) {
  const { t } = useTranslation()
  const {
    kind,
    document,
    i18nNs,
    chatResetKey,
    mentionIds,
    attachments,
  } = useDocumentAssistant()

  const greeting = t(`${i18nNs}:ai.greeting`)

  const contextRef = useRef({
    kind,
    document,
    mentionIds,
    attachments,
    targets,
  })
  contextRef.current = {
    kind,
    document,
    mentionIds,
    attachments,
    targets,
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
              mentions: resolveMentionsForApi(ctx.mentionIds, ctx.targets),
              attachments: attachmentsForApi(ctx.attachments),
            },
          }
        },
      }),
    []
  )

  const chat = useChat({
    id: `document-ai-${kind}-${chatResetKey}`,
    transport,
    messages: [createWelcomeMessage(greeting)],
    // After user approves/rejects replace tool, continue the stream so execute runs.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })

  const [input, setInput] = useState("")

  useEffect(() => {
    setInput("")
  }, [chatResetKey])

  useEffect(() => {
    if (
      chat.messages.length === 1 &&
      chat.messages[0]?.id === DOCUMENT_AI_WELCOME_ID
    ) {
      chat.setMessages([createWelcomeMessage(greeting)])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional greeting sync
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

  const handleSubmit = useCallback(async () => {
    await sendText(input)
  }, [input, sendText])

  const approveReplace = useCallback(
    (approvalId: string) => {
      void chat.addToolApprovalResponse({
        id: approvalId,
        approved: true,
      })
    },
    [chat]
  )

  const rejectReplace = useCallback(
    (approvalId: string) => {
      void chat.addToolApprovalResponse({
        id: approvalId,
        approved: false,
        reason: "User rejected the replacement",
      })
    },
    [chat]
  )

  const showSuggestions =
    chat.messages.length === 1 &&
    chat.messages[0]?.id === DOCUMENT_AI_WELCOME_ID &&
    !isBusy &&
    // Selection attachments mean the user already has a focus — skip tips.
    attachments.length === 0

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
    approveReplace,
    rejectReplace,
  }
}

export type UseDocumentAssistantChatReturn = ReturnType<
  typeof useDocumentAssistantChat
>
