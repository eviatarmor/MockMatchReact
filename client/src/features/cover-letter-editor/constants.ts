import { LayoutTemplate, Palette, ListChecks, ClipboardCheck, Sparkles, Hand, Heading, Pilcrow, PenLine, SquarePlus } from "lucide-react"
import type { BlockTypeMeta } from "@/components/document-editor"
import type {
  CoverLetterDocument,
  EditorRailItem,
  EditorTemplate,
  LetterBlock,
  StyleAccent,
  StyleSegmentOption,
  StyleTypeface,
} from "./types"

const newId = () => crypto.randomUUID()

export const EDITOR_RAIL_ITEMS: readonly EditorRailItem[] = [
  { id: "templates", icon: LayoutTemplate, labelKey: "rail.templates" },
  { id: "style", icon: Palette, labelKey: "rail.style" },
  { id: "sections", icon: ListChecks, labelKey: "rail.sections" },
  { id: "analysis", icon: ClipboardCheck, labelKey: "rail.analysis" },
  { id: "ai", icon: Sparkles, labelKey: "rail.ai" },
]

export const EDITOR_TEMPLATES: readonly EditorTemplate[] = [
  {
    id: "modern",
    layout: "standard",
    nameKey: "templates.items.modern.name",
    descriptionKey: "templates.items.modern.description",
    defaultStyle: { accent: "blue", typeface: "geist", heading: "accent", density: "normal" },
  },
  {
    id: "classic",
    layout: "centered",
    nameKey: "templates.items.classic.name",
    descriptionKey: "templates.items.classic.description",
    defaultStyle: { accent: "slate", typeface: "source-serif", heading: "underline", density: "normal" },
  },
  {
    id: "minimal",
    layout: "caps",
    nameKey: "templates.items.minimal.name",
    descriptionKey: "templates.items.minimal.description",
    defaultStyle: { accent: "slate", typeface: "geist", heading: "small-caps", density: "relaxed" },
  },
  {
    id: "technical",
    layout: "grid",
    nameKey: "templates.items.technical.name",
    descriptionKey: "templates.items.technical.description",
    defaultStyle: { accent: "teal", typeface: "mono", heading: "plain", density: "compact" },
  },
  {
    id: "executive",
    layout: "executive",
    nameKey: "templates.items.executive.name",
    descriptionKey: "templates.items.executive.description",
    defaultStyle: { accent: "slate", typeface: "newsreader", heading: "underline", density: "normal" },
  },
  {
    id: "compact",
    layout: "compact",
    nameKey: "templates.items.compact.name",
    descriptionKey: "templates.items.compact.description",
    defaultStyle: { accent: "indigo", typeface: "geist", heading: "plain", density: "compact" },
  },
  {
    id: "banner",
    layout: "banner",
    nameKey: "templates.items.banner.name",
    descriptionKey: "templates.items.banner.description",
    defaultStyle: { accent: "blue", typeface: "geist", heading: "accent", density: "normal" },
  },
  {
    id: "editorial",
    layout: "editorial",
    nameKey: "templates.items.editorial.name",
    descriptionKey: "templates.items.editorial.description",
    defaultStyle: { accent: "rose", typeface: "newsreader", heading: "plain", density: "relaxed" },
  },
  {
    id: "elegant",
    layout: "elegant",
    nameKey: "templates.items.elegant.name",
    descriptionKey: "templates.items.elegant.description",
    defaultStyle: { accent: "purple", typeface: "source-serif", heading: "small-caps", density: "relaxed" },
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

/** Block type registry — drives the "Add section" menu and the Sections panel. */
export const LETTER_BLOCK_TYPES: readonly BlockTypeMeta<LetterBlock>[] = [
  { type: "greeting", icon: Hand, labelKey: "blocks.greeting", make: () => ({ id: newId(), type: "greeting", text: "" }) },
  { type: "subject", icon: Heading, labelKey: "blocks.subject", make: () => ({ id: newId(), type: "subject", text: "" }) },
  { type: "paragraph", icon: Pilcrow, labelKey: "blocks.paragraph", make: () => ({ id: newId(), type: "paragraph", text: "" }) },
  { type: "signoff", icon: PenLine, labelKey: "blocks.signoff", make: () => ({ id: newId(), type: "signoff", closing: "", signature: "" }) },
  { type: "custom", icon: SquarePlus, labelKey: "blocks.custom", make: () => ({ id: newId(), type: "custom", heading: "", text: "" }) },
] satisfies readonly BlockTypeMeta<LetterBlock>[]

/** Blank starter for new cover letters. */
export function createBlankCoverLetterDocument(): CoverLetterDocument {
  return {
    sender: {
      name: "",
      title: "",
      contacts: [
        { id: "email", iconKey: "mail", value: "" },
        { id: "phone", iconKey: "phone", value: "" },
        { id: "location", iconKey: "mapPin", value: "" },
        { id: "website", iconKey: "globe", value: "" },
        { id: "linkedin", iconKey: "link", value: "" },
      ],
    },
    date: "",
    recipient: {
      name: "",
      company: "",
      addressLines: [""],
    },
    blocks: [
      { id: newId(), type: "greeting", text: "" },
      { id: newId(), type: "paragraph", text: "" },
      { id: newId(), type: "signoff", closing: "", signature: "" },
    ],
  }
}

/** Sample document for local previews. */
export const SAMPLE_DOCUMENT: CoverLetterDocument = {
  sender: {
    name: "Dana Rivera",
    title: "Senior Product Designer",
    contacts: [
      { id: "email", iconKey: "mail", value: "dana.rivera@email.com" },
      { id: "phone", iconKey: "phone", value: "(415) 555-0148" },
      { id: "location", iconKey: "mapPin", value: "San Francisco, CA" },
      { id: "website", iconKey: "globe", value: "dana.design" },
      { id: "linkedin", iconKey: "link", value: "in/danarivera" },
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
