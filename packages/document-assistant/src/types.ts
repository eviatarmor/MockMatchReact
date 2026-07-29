import type { LucideIcon } from "lucide-react"

export type DocumentAiKind = "resume" | "cover_letter"

/** Selected or section-scoped text staged as an attachment chip. */
export type TextAttachment = {
  readonly id: string
  /** Display title (hierarchical when from a section/entry). */
  readonly title: string
  readonly text: string
  /** Section/block id when staged from block AI toolbar. */
  readonly targetId?: string
  readonly primaryLabel?: string
  readonly groupLabel?: string
  readonly icon?: LucideIcon
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
  /**
   * Open AI rail and stage a section/block as an attachment
   * (from block toolbar AI icon).
   */
  readonly openWithMention: (targetId: string) => void
  readonly openWithAttachment: (text: string, title?: string) => void
  readonly attachments: readonly TextAttachment[]
  readonly removeAttachment: (id: string) => void
  readonly clearPending: () => void
}
