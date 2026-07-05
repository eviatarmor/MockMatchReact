import type { LucideIcon } from "lucide-react"
import type { DocumentStyle } from "@/components/document-editor"

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

/** The body of a letter is an ordered list of typed blocks. */
export type LetterBlockType = "greeting" | "paragraph" | "subject" | "signoff" | "custom"

interface LetterBlockBase {
  readonly id: string
  readonly type: LetterBlockType
}

export interface GreetingBlock extends LetterBlockBase {
  readonly type: "greeting"
  readonly text: string
}

export interface ParagraphBlock extends LetterBlockBase {
  readonly type: "paragraph"
  readonly text: string
}

export interface SubjectBlock extends LetterBlockBase {
  readonly type: "subject"
  readonly text: string
}

export interface SignoffBlock extends LetterBlockBase {
  readonly type: "signoff"
  readonly closing: string
  readonly signature: string
}

export interface CustomBlock extends LetterBlockBase {
  readonly type: "custom"
  readonly heading: string
  readonly text: string
}

export type LetterBlock = GreetingBlock | ParagraphBlock | SubjectBlock | SignoffBlock | CustomBlock

/**
 * Presentational data model for a cover letter document.
 *
 * Kept transport-agnostic so the same shape can drive the editor canvas, a
 * read-only preview, or a future PDF/export pipeline elsewhere in the app. The
 * body is a block list so sections can be added, reordered, and removed.
 */
export interface CoverLetterDocument {
  readonly sender: LetterSender
  readonly date: string
  readonly recipient: LetterRecipient
  readonly blocks: readonly LetterBlock[]
}

export type EditorTemplateId = "modern" | "classic" | "minimal" | "technical"

/**
 * Visual template definition. Carries the layout identity (`id` drives header
 * centering / small-caps quirks) plus the {@link DocumentStyle} defaults it
 * seeds — the Style panel then overrides any axis on top.
 */
export interface EditorTemplate {
  readonly id: EditorTemplateId
  readonly nameKey: string
  readonly descriptionKey: string
  /** Style axes this template seeds (accent/typeface/heading/density). */
  readonly defaultStyle: DocumentStyle
}

/** Accent color swatch shown in the Style panel. */
export interface StyleAccent {
  readonly id: string
  /** Tailwind background class for the swatch + selected accent. */
  readonly swatchClass: string
}

/** Typeface option card (preview glyph + name + description). */
export interface StyleTypeface {
  readonly id: string
  readonly nameKey: string
  readonly descriptionKey: string
  /** Tailwind font-family class applied to the "Aa" preview. */
  readonly sampleClass: string
}

/** Single option inside a segmented control (heading style, density). */
export interface StyleSegmentOption {
  readonly id: string
  readonly labelKey: string
}

export type EditorPanelId = "templates" | "style" | "sections" | "ai"

/** Right-rail entry: icon button that toggles its panel. */
export interface EditorRailItem {
  readonly id: EditorPanelId
  readonly icon: LucideIcon
  readonly labelKey: string
}
