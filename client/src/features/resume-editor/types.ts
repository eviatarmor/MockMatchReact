import type { LucideIcon } from "lucide-react"
import type { DocumentStyle } from "@/components/document-editor"

/** A single contact entry rendered in the resume header (icon + value). */
export interface ResumeContactEntry {
  readonly id: string
  readonly icon: LucideIcon
  readonly value: string
}

/** Header block shown at the top of the resume (name + headline + contacts). */
export interface ResumeHeader {
  readonly name: string
  readonly headline: string
  readonly contacts: readonly ResumeContactEntry[]
}

/** A stably-keyed rich-text line — used for bullet lists (holds Lexical HTML). */
export interface BulletItem {
  readonly id: string
  readonly text: string
}

/**
 * The resume body is an ordered list of typed sections. Every section variant
 * discriminates on `type`; the `custom` variant is the "design your own"
 * escape hatch (heading + free rich-text body).
 */
export type ResumeSectionType =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "volunteering"
  | "awards"
  | "certifications"
  | "publications"
  | "languages"
  | "affiliations"
  | "hobbies"
  | "references"
  | "custom"

interface ResumeSectionBase {
  readonly id: string
  readonly type: ResumeSectionType
}

export interface SummarySection extends ResumeSectionBase {
  readonly type: "summary"
  readonly text: string
}

export interface ExperienceSection extends ResumeSectionBase {
  readonly type: "experience"
  readonly role: string
  readonly company: string
  readonly location: string
  readonly startDate: string
  readonly endDate: string
  readonly current: boolean
  readonly bullets: readonly BulletItem[]
}

export interface EducationSection extends ResumeSectionBase {
  readonly type: "education"
  readonly school: string
  readonly degree: string
  readonly field: string
  readonly location: string
  readonly startDate: string
  readonly endDate: string
  readonly bullets: readonly BulletItem[]
}

/** A named group of skill tags (e.g. "Languages", "Tools"). */
export interface SkillGroup {
  readonly id: string
  readonly name: string
  readonly items: readonly BulletItem[]
}

export interface SkillsSection extends ResumeSectionBase {
  readonly type: "skills"
  readonly groups: readonly SkillGroup[]
}

export interface ProjectsSection extends ResumeSectionBase {
  readonly type: "projects"
  readonly name: string
  readonly url: string
  readonly description: string
  readonly bullets: readonly BulletItem[]
}

export interface VolunteeringSection extends ResumeSectionBase {
  readonly type: "volunteering"
  readonly organization: string
  readonly role: string
  readonly location: string
  readonly startDate: string
  readonly endDate: string
  readonly bullets: readonly BulletItem[]
}

export interface AwardsSection extends ResumeSectionBase {
  readonly type: "awards"
  readonly title: string
  readonly issuer: string
  readonly date: string
  readonly description: string
}

export interface CertificationsSection extends ResumeSectionBase {
  readonly type: "certifications"
  readonly name: string
  readonly issuer: string
  readonly date: string
  readonly credentialId: string
}

export interface PublicationsSection extends ResumeSectionBase {
  readonly type: "publications"
  readonly title: string
  readonly publisher: string
  readonly date: string
  readonly url: string
}

/** A single spoken/written language + proficiency. */
export interface LanguageItem {
  readonly id: string
  readonly name: string
  readonly proficiency: string
}

export interface LanguagesSection extends ResumeSectionBase {
  readonly type: "languages"
  readonly items: readonly LanguageItem[]
}

export interface AffiliationsSection extends ResumeSectionBase {
  readonly type: "affiliations"
  readonly organization: string
  readonly role: string
  readonly date: string
}

export interface HobbiesSection extends ResumeSectionBase {
  readonly type: "hobbies"
  readonly items: readonly BulletItem[]
}

/** A single reference (person the reader may contact). */
export interface ReferenceItem {
  readonly id: string
  readonly name: string
  readonly relation: string
  readonly contact: string
}

export interface ReferencesSection extends ResumeSectionBase {
  readonly type: "references"
  readonly items: readonly ReferenceItem[]
}

export interface CustomSection extends ResumeSectionBase {
  readonly type: "custom"
  readonly heading: string
  readonly text: string
}

export type ResumeSection =
  | SummarySection
  | ExperienceSection
  | EducationSection
  | SkillsSection
  | ProjectsSection
  | VolunteeringSection
  | AwardsSection
  | CertificationsSection
  | PublicationsSection
  | LanguagesSection
  | AffiliationsSection
  | HobbiesSection
  | ReferencesSection
  | CustomSection

/**
 * Presentational data model for a resume document.
 *
 * Transport-agnostic so the same shape can drive the editor canvas, a read-only
 * preview, or a future PDF/export pipeline. The body is a section list so
 * sections can be added, reordered, and removed via the shared block-list engine.
 */
export interface ResumeDocument {
  readonly header: ResumeHeader
  readonly sections: readonly ResumeSection[]
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
