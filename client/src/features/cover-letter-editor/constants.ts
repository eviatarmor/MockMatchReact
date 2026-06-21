import { Mail, Phone, MapPin, Globe, Link2, LayoutTemplate, Palette, ListChecks, Sparkles, Columns2, UserRound, Minus, Hand, Heading, Pilcrow, PenLine, SquarePlus, type LucideIcon } from "lucide-react"
import type {
  CoverLetterDocument,
  EditorRailItem,
  EditorTemplate,
  LetterBlock,
  LetterBlockType,
  StyleAccent,
  StyleSegmentOption,
  StyleToggle,
  StyleTypeface,
} from "./types"

const newId = () => crypto.randomUUID()

/** Zoom bounds + step for the canvas viewport (1 = 100%). */
export const ZOOM = {
  min: 0.4,
  max: 2.5,
  step: 0.1,
  default: 1,
} as const

export const EDITOR_RAIL_ITEMS: readonly EditorRailItem[] = [
  { id: "templates", icon: LayoutTemplate, labelKey: "rail.templates" },
  { id: "style", icon: Palette, labelKey: "rail.style" },
  { id: "sections", icon: ListChecks, labelKey: "rail.sections" },
  { id: "ai", icon: Sparkles, labelKey: "rail.ai" },
]

export const EDITOR_TEMPLATES: readonly EditorTemplate[] = [
  {
    id: "modern",
    nameKey: "templates.items.modern.name",
    descriptionKey: "templates.items.modern.description",
    accentClass: "text-blue-600 dark:text-blue-500",
    serif: false,
  },
  {
    id: "classic",
    nameKey: "templates.items.classic.name",
    descriptionKey: "templates.items.classic.description",
    accentClass: "text-neutral-900 dark:text-neutral-100",
    serif: true,
  },
  {
    id: "minimal",
    nameKey: "templates.items.minimal.name",
    descriptionKey: "templates.items.minimal.description",
    accentClass: "text-neutral-500 dark:text-neutral-400",
    serif: false,
  },
  {
    id: "technical",
    nameKey: "templates.items.technical.name",
    descriptionKey: "templates.items.technical.description",
    accentClass: "text-teal-600 dark:text-teal-500",
    serif: false,
  },
]

/** Accent colors offered in the Style panel. */
export const STYLE_ACCENTS: readonly StyleAccent[] = [
  { id: "blue", swatchClass: "bg-blue-600" },
  { id: "teal", swatchClass: "bg-teal-600" },
  { id: "indigo", swatchClass: "bg-indigo-600" },
  { id: "emerald", swatchClass: "bg-emerald-600" },
  { id: "amber", swatchClass: "bg-amber-500" },
  { id: "rose", swatchClass: "bg-rose-500" },
  { id: "purple", swatchClass: "bg-purple-500" },
  { id: "slate", swatchClass: "bg-slate-700" },
]

/** Typeface options (preview glyph + name + description). */
export const STYLE_TYPEFACES: readonly StyleTypeface[] = [
  { id: "geist", nameKey: "style.typefaces.geist.name", descriptionKey: "style.typefaces.geist.description", sampleClass: "font-sans" },
  { id: "source-serif", nameKey: "style.typefaces.sourceSerif.name", descriptionKey: "style.typefaces.sourceSerif.description", sampleClass: "font-serif" },
  { id: "newsreader", nameKey: "style.typefaces.newsreader.name", descriptionKey: "style.typefaces.newsreader.description", sampleClass: "font-serif" },
  { id: "mono", nameKey: "style.typefaces.mono.name", descriptionKey: "style.typefaces.mono.description", sampleClass: "font-mono" },
]

/** Section-heading treatments (segmented control). */
export const STYLE_HEADINGS: readonly StyleSegmentOption[] = [
  { id: "accent", labelKey: "style.headingStyles.accent" },
  { id: "underline", labelKey: "style.headingStyles.underline" },
  { id: "small-caps", labelKey: "style.headingStyles.smallCaps" },
  { id: "plain", labelKey: "style.headingStyles.plain" },
]

/** Content density (segmented control). */
export const STYLE_DENSITIES: readonly StyleSegmentOption[] = [
  { id: "compact", labelKey: "style.densities.compact" },
  { id: "normal", labelKey: "style.densities.normal" },
  { id: "relaxed", labelKey: "style.densities.relaxed" },
]

/** Boolean layout features (icon + label + switch). */
export const STYLE_TOGGLES: readonly StyleToggle[] = [
  { id: "two-column", icon: Columns2, titleKey: "style.toggles.twoColumn.title", descriptionKey: "style.toggles.twoColumn.description" },
  { id: "photo", icon: UserRound, titleKey: "style.toggles.photo.title", descriptionKey: "style.toggles.photo.description" },
  { id: "accent-rule", icon: Minus, titleKey: "style.toggles.accentRule.title", descriptionKey: "style.toggles.accentRule.description" },
]

/** Block type registry — drives the "Add section" menu and the Sections panel. */
export interface LetterBlockTypeMeta {
  readonly type: LetterBlockType
  readonly icon: LucideIcon
  readonly labelKey: string
  /** Factory for a fresh, empty block of this type. */
  readonly make: () => LetterBlock
}

export const LETTER_BLOCK_TYPES: readonly LetterBlockTypeMeta[] = [
  { type: "greeting", icon: Hand, labelKey: "blocks.greeting", make: () => ({ id: newId(), type: "greeting", text: "" }) },
  { type: "subject", icon: Heading, labelKey: "blocks.subject", make: () => ({ id: newId(), type: "subject", text: "" }) },
  { type: "paragraph", icon: Pilcrow, labelKey: "blocks.paragraph", make: () => ({ id: newId(), type: "paragraph", text: "" }) },
  { type: "signoff", icon: PenLine, labelKey: "blocks.signoff", make: () => ({ id: newId(), type: "signoff", closing: "", signature: "" }) },
  { type: "custom", icon: SquarePlus, labelKey: "blocks.custom", make: () => ({ id: newId(), type: "custom", heading: "", text: "" }) },
]

/** Sample document — placeholder until the editor is wired to real data. */
export const SAMPLE_DOCUMENT: CoverLetterDocument = {
  sender: {
    name: "Dana Rivera",
    title: "Senior Product Designer",
    contacts: [
      { id: "email", icon: Mail, value: "dana.rivera@email.com" },
      { id: "phone", icon: Phone, value: "(415) 555-0148" },
      { id: "location", icon: MapPin, value: "San Francisco, CA" },
      { id: "website", icon: Globe, value: "dana.design" },
      { id: "linkedin", icon: Link2, value: "in/danarivera" },
    ],
  },
  date: "June 20, 2026",
  recipient: {
    name: "Hiring Team",
    company: "Northwind",
    addressLines: ["Product Design", "Remote"],
  },
  blocks: [
    { id: "greeting", type: "greeting", text: "Dear Hiring Team," },
    {
      id: "p1",
      type: "paragraph",
      text: "I'm writing to express my interest in the Senior Product Designer role at Northwind. Over the past seven years I've shaped data-dense B2B tools, leading design for two 0→1 launches and lifting activation 38% through systems thinking, tight engineering partnership, and rigorous research.",
    },
    {
      id: "p2",
      type: "paragraph",
      text: "At my current company I drove the end-to-end redesign of an analytics suite, cutting time-to-insight in half, and built a 60-component design system adopted across four product teams. I care deeply about pairing craft with measurable outcomes — and about mentoring the people around me as the team grows.",
    },
    {
      id: "p3",
      type: "paragraph",
      text: "Northwind's focus on giving operators clarity over their data maps directly to the work I love. I'd welcome the chance to bring that same rigor to your team and help ship the next stage of the product.",
    },
    { id: "signoff", type: "signoff", closing: "Sincerely,", signature: "Dana Rivera" },
  ],
}
