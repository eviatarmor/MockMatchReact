import { Mail, Phone, MapPin, Globe, Link2, LayoutTemplate, Palette, ListChecks, Sparkles } from "lucide-react"
import type { CoverLetterDocument, EditorRailItem, EditorTemplate } from "./types"

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

/** Document sections offered in the Sections panel (structural, copy in i18n). */
export const EDITOR_SECTIONS = [
  { id: "header", labelKey: "sections.items.header", removable: false },
  { id: "date", labelKey: "sections.items.date", removable: true },
  { id: "recipient", labelKey: "sections.items.recipient", removable: true },
  { id: "salutation", labelKey: "sections.items.salutation", removable: false },
  { id: "body", labelKey: "sections.items.body", removable: false },
  { id: "signature", labelKey: "sections.items.signature", removable: true },
] as const

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
  salutation: "Dear Hiring Team,",
  paragraphs: [
    "I'm writing to express my interest in the Senior Product Designer role at Northwind. Over the past seven years I've shaped data-dense B2B tools, leading design for two 0→1 launches and lifting activation 38% through systems thinking, tight engineering partnership, and rigorous research.",
    "At my current company I drove the end-to-end redesign of an analytics suite, cutting time-to-insight in half, and built a 60-component design system adopted across four product teams. I care deeply about pairing craft with measurable outcomes — and about mentoring the people around me as the team grows.",
    "Northwind's focus on giving operators clarity over their data maps directly to the work I love. I'd welcome the chance to bring that same rigor to your team and help ship the next stage of the product.",
  ],
  closing: "Sincerely,",
  signature: "Dana Rivera",
}
