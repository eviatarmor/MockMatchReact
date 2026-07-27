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
  const [mentionIds, setMentionIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<TextAttachment[]>([])
  const [pendingInsertId, setPendingInsertId] = useState<string | null>(null)

  const requestOpenAi = useCallback(() => {
    setOpenRequestKey((k) => k + 1)
  }, [])

  const openWithMention = useCallback(
    (targetId: string) => {
      const id = targetId.trim()
      if (!id) return
      // DiceUI inserts the in-field @ tag; mentionIds update via onValueChange.
      setPendingInsertId(id)
      // Also stage section body as an attachment (same chip as Lexical selection AI).
      const attachment = resolveTargetAttachment(kind, document, id)
      if (attachment) {
        setAttachments((prev) => {
          // Replace any prior chip for the same section text to avoid stacking.
          const withoutDup = prev.filter((a) => a.text !== attachment.text)
          return [
            ...withoutDup,
            {
              id: crypto.randomUUID(),
              title: attachment.title,
              text: attachment.text,
            },
          ]
        })
      }
      setOpenRequestKey((k) => k + 1)
    },
    [kind, document]
  )

  const clearPendingInsert = useCallback(() => {
    setPendingInsertId(null)
  }, [])

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

  const removeMention = useCallback((id: string) => {
    setMentionIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const clearPending = useCallback(() => {
    setMentionIds([])
    setAttachments([])
    setPendingInsertId(null)
  }, [])

  const newChat = useCallback(() => {
    setChatResetKey((k) => k + 1)
    setMentionIds([])
    setAttachments([])
    setPendingInsertId(null)
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
      pendingInsertId,
      clearPendingInsert,
      mentionIds,
      setMentionIds,
      removeMention,
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
      pendingInsertId,
      clearPendingInsert,
      mentionIds,
      removeMention,
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
