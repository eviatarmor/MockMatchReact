import type { LucideIcon } from "lucide-react"

/** A single contact entry rendered in the document header (icon + value). */
export interface LetterContact {
  readonly id: string
  readonly icon: LucideIcon
  readonly value: string
}

/** Sender block shown at the top of the letter. */
export interface LetterSender {
  readonly name: string
  readonly title: string
  readonly contacts: readonly LetterContact[]
}

/** Recipient / addressee block (optional fields render only when present). */
export interface LetterRecipient {
  readonly name?: string
  readonly title?: string
  readonly company: string
  readonly addressLines?: readonly string[]
}

/**
 * Presentational data model for a cover letter document.
 *
 * Kept transport-agnostic so the same shape can drive the editor canvas, a
 * read-only preview, or a future PDF/export pipeline elsewhere in the app.
 */
export interface CoverLetterDocument {
  readonly sender: LetterSender
  readonly date: string
  readonly recipient: LetterRecipient
  readonly salutation: string
  readonly paragraphs: readonly string[]
  readonly closing: string
  readonly signature: string
}

export type EditorTemplateId = "modern" | "classic" | "minimal" | "technical"

/** Visual template definition — drives accent + typographic treatment. */
export interface EditorTemplate {
  readonly id: EditorTemplateId
  readonly nameKey: string
  readonly descriptionKey: string
  /** Tailwind text-color class for accent elements (name, headings, rules). */
  readonly accentClass: string
  readonly serif: boolean
}

export type EditorPanelId = "templates" | "style" | "sections" | "ai"

/** Right-rail entry: icon button that toggles its panel. */
export interface EditorRailItem {
  readonly id: EditorPanelId
  readonly icon: LucideIcon
  readonly labelKey: string
}
