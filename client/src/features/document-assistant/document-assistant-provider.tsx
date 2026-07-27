import { useCallback, useMemo, useState, type ReactNode } from "react"
import { DocumentAssistantContext } from "./document-assistant-context"
import { applyDocumentTextReplacement } from "./lib/apply-text-replacement"
import { resolveTargetAttachment } from "./lib/resolve-target-attachment"
import type {
  ApplyTextReplacementFn,
  DocumentAiKind,
  DocumentAssistantContextValue,
  TextAttachment,
} from "./types"

type DocumentAssistantProviderProps = {
  readonly kind: DocumentAiKind
  readonly document: unknown
  readonly i18nNs: string
  /**
   * Commit a mutated document snapshot into the editor store
   * (e.g. session.replaceDocument).
   */
  readonly onDocumentReplace?: (next: unknown) => void
  readonly children: ReactNode
}

export function DocumentAssistantProvider({
  kind,
  document,
  i18nNs,
  onDocumentReplace,
  children,
}: DocumentAssistantProviderProps) {
  const [openRequestKey, setOpenRequestKey] = useState(0)
  const [chatResetKey, setChatResetKey] = useState(0)
  const [attachments, setAttachments] = useState<TextAttachment[]>([])

  const requestOpenAi = useCallback(() => {
    setOpenRequestKey((k) => k + 1)
  }, [])

  /** Block AI icon → open rail + stage section body as attachment (no @ mentions). */
  const openWithMention = useCallback(
    (targetId: string) => {
      const id = targetId.trim()
      if (!id) return
      const attachment = resolveTargetAttachment(kind, document, id)
      if (attachment) {
        setAttachments((prev) => {
          const withoutDup = prev.filter(
            (a) =>
              a.text !== attachment.text &&
              a.targetId !== attachment.targetId
          )
          return [
            ...withoutDup,
            {
              id: crypto.randomUUID(),
              title: attachment.title,
              text: attachment.text,
              targetId: attachment.targetId,
              primaryLabel: attachment.primaryLabel,
              groupLabel: attachment.groupLabel,
              icon: attachment.icon,
            },
          ]
        })
      }
      setOpenRequestKey((k) => k + 1)
    },
    [kind, document]
  )

  const openWithAttachment = useCallback((text: string, title?: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setAttachments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: title?.trim() || "Selected text",
        text: trimmed,
      },
    ])
    setOpenRequestKey((k) => k + 1)
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const clearPending = useCallback(() => {
    setAttachments([])
  }, [])

  const newChat = useCallback(() => {
    setChatResetKey((k) => k + 1)
    setAttachments([])
    setOpenRequestKey((k) => k + 1)
  }, [])

  const applyTextReplacement = useMemo<ApplyTextReplacementFn | null>(() => {
    if (!onDocumentReplace) return null
    return (input) => {
      const result = applyDocumentTextReplacement(kind, document, input)
      if (!result.ok) return { ok: false, reason: result.reason }
      onDocumentReplace(result.document)
      return { ok: true, count: result.count }
    }
  }, [kind, document, onDocumentReplace])

  const value = useMemo<DocumentAssistantContextValue>(
    () => ({
      kind,
      document,
      i18nNs,
      applyTextReplacement,
      openRequestKey,
      chatResetKey,
      newChat,
      requestOpenAi,
      openWithMention,
      openWithAttachment,
      attachments,
      removeAttachment,
      clearPending,
    }),
    [
      kind,
      document,
      i18nNs,
      applyTextReplacement,
      openRequestKey,
      chatResetKey,
      newChat,
      requestOpenAi,
      openWithMention,
      openWithAttachment,
      attachments,
      removeAttachment,
      clearPending,
    ]
  )

  return (
    <DocumentAssistantContext.Provider value={value}>
      {children}
    </DocumentAssistantContext.Provider>
  )
}
