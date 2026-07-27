export type DocumentAiKind = "resume" | "cover_letter"

/** A document region the user can @-mention in the assistant input. */
export type MentionTarget = {
  readonly id: string
  readonly label: string
  /** Coarse kind for system prompt (section, entry, header, block, …). */
  readonly kind: string
  /** Plain-text context resolved at send time from the live document. */
  readonly getContext: () => string
}

/** Selected Lexical text staged as an attachment chip. */
export type TextAttachment = {
  readonly id: string
  readonly title: string
  readonly text: string
}

export type ApplyTextReplacementFn = (input: {
  find: string
  replacement: string
  targetId?: string
}) => { ok: true; count: number } | { ok: false; reason: string }

export type DocumentAssistantContextValue = {
  readonly kind: DocumentAiKind
  readonly document: unknown
  readonly i18nNs: string
  /** Apply an approved find→replace into the live editor document. */
  readonly applyTextReplacement: ApplyTextReplacementFn | null
  /** Bumped when something requests the AI rail/sheet open. */
  readonly openRequestKey: number
  /** Bumped on New chat so the chat hook remounts. */
  readonly chatResetKey: number
  readonly newChat: () => void
  readonly requestOpenAi: () => void
  readonly openWithMention: (targetId: string) => void
  readonly openWithAttachment: (text: string, title?: string) => void
  /**
   * Section id to inject as an in-field @ tag (from block AI icon).
   * Cleared after the input finishes inserting via DiceUI.
   */
  readonly pendingInsertId: string | null
  readonly clearPendingInsert: () => void
  readonly mentionIds: readonly string[]
  readonly setMentionIds: (ids: string[]) => void
  readonly removeMention: (id: string) => void
  readonly attachments: readonly TextAttachment[]
  readonly removeAttachment: (id: string) => void
  readonly clearPending: () => void
}
