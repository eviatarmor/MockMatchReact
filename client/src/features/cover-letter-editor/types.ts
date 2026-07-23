import type { LucideIcon } from "lucide-react"
import type { ContactIconKey } from "@mockmatch/schemas"
import type { DocumentStyle } from "@/components/document-editor"

/** A single contact entry rendered in the document header (icon + value). */
export interface LetterContact {
  readonly id: string
  readonly iconKey: ContactIconKey
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

export type EditorTemplateId =
  | "modern"
  | "classic"
  | "minimal"
  | "technical"
  | "executive"
  | "compact"
  | "banner"
  | "editorial"
  | "elegant"

/**
 * Header/structure treatment a template applies on top of the shared single-column
 * body. Layouts stay ATS-safe (single text column) — they vary the header block
 * and the name/contact placement only.
 * - `standard`   — left-aligned name over an accent rule (Modern).
 * - `centered`   — centered name + contacts, serif rules (Classic).
 * - `caps`       — airy uppercase name, no rules (Minimal).
 * - `grid`       — tight mono header, plain rules (Technical).
 * - `executive`  — large name, contacts under a heavy rule.
 * - `compact`    — dense header, plain separator.
 * - `banner`     — full-width accent color band behind the name/title.
 * - `editorial`  — oversized serif name with a thin accent underline.
 * - `elegant`    — centered small-caps name with an accent hairline frame.
 */
export type TemplateLayoutId =
  | "standard"
  | "centered"
  | "caps"
  | "grid"
  | "executive"
  | "compact"
  | "banner"
  | "editorial"
  | "elegant"

/**
 * Visual template definition. Carries the {@link TemplateLayoutId} that drives the
 * header/structure treatment plus the {@link DocumentStyle} defaults it seeds —
 * the Style panel then overrides any style axis on top.
 */
export interface EditorTemplate {
  readonly id: EditorTemplateId
  readonly layout: TemplateLayoutId
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

export type EditorPanelId = "templates" | "style" | "sections" | "analysis" | "ai"

/** Right-rail entry: icon button that toggles its panel. */
export interface EditorRailItem {
  readonly id: EditorPanelId
  readonly icon: LucideIcon
  readonly labelKey: string
}
