import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Link2,
  LayoutTemplate,
  Palette,
  ListChecks,
  Sparkles,
  Columns2,
  UserRound,
  Minus,
  AlignLeft,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  HeartHandshake,
  Trophy,
  BadgeCheck,
  BookOpen,
  Languages,
  Users,
  Sparkle,
  Contact,
  SquarePlus,
} from "lucide-react"
import type { BlockTypeMeta } from "@/components/document-editor"
import type {
  EditorRailItem,
  EditorTemplate,
  ResumeDocument,
  ResumeSection,
  StyleAccent,
  StyleSegmentOption,
  StyleToggle,
  StyleTypeface,
} from "./types"

const newId = () => crypto.randomUUID()

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

/**
 * Section-type registry — the single source of truth for what sections exist.
 * Drives the "Add section" menu, the Sections panel, and the between-section
 * inserter. Adding a section type = one entry here + one variant in `types.ts` +
 * one case in `block-fields.tsx` (open/closed — no engine changes).
 */
export const RESUME_SECTION_TYPES: readonly BlockTypeMeta<ResumeSection>[] = [
  { type: "summary", icon: AlignLeft, labelKey: "sections.summary", make: () => ({ id: newId(), type: "summary", text: "" }) },
  {
    type: "experience",
    icon: Briefcase,
    labelKey: "sections.experience",
    make: () => ({ id: newId(), type: "experience", role: "", company: "", location: "", startDate: "", endDate: "", current: false, bullets: [{ id: newId(), text: "" }] }),
  },
  {
    type: "education",
    icon: GraduationCap,
    labelKey: "sections.education",
    make: () => ({ id: newId(), type: "education", school: "", degree: "", field: "", location: "", startDate: "", endDate: "", bullets: [] }),
  },
  {
    type: "skills",
    icon: Wrench,
    labelKey: "sections.skills",
    make: () => ({ id: newId(), type: "skills", groups: [{ id: newId(), name: "", items: [{ id: newId(), text: "" }] }] }),
  },
  {
    type: "projects",
    icon: FolderGit2,
    labelKey: "sections.projects",
    make: () => ({ id: newId(), type: "projects", name: "", url: "", description: "", bullets: [{ id: newId(), text: "" }] }),
  },
  {
    type: "volunteering",
    icon: HeartHandshake,
    labelKey: "sections.volunteering",
    make: () => ({ id: newId(), type: "volunteering", organization: "", role: "", location: "", startDate: "", endDate: "", bullets: [] }),
  },
  { type: "awards", icon: Trophy, labelKey: "sections.awards", make: () => ({ id: newId(), type: "awards", title: "", issuer: "", date: "", description: "" }) },
  { type: "certifications", icon: BadgeCheck, labelKey: "sections.certifications", make: () => ({ id: newId(), type: "certifications", name: "", issuer: "", date: "", credentialId: "" }) },
  { type: "publications", icon: BookOpen, labelKey: "sections.publications", make: () => ({ id: newId(), type: "publications", title: "", publisher: "", date: "", url: "" }) },
  {
    type: "languages",
    icon: Languages,
    labelKey: "sections.languages",
    make: () => ({ id: newId(), type: "languages", items: [{ id: newId(), name: "", proficiency: "" }] }),
  },
  { type: "affiliations", icon: Users, labelKey: "sections.affiliations", make: () => ({ id: newId(), type: "affiliations", organization: "", role: "", date: "" }) },
  { type: "hobbies", icon: Sparkle, labelKey: "sections.hobbies", make: () => ({ id: newId(), type: "hobbies", items: [{ id: newId(), text: "" }] }) },
  {
    type: "references",
    icon: Contact,
    labelKey: "sections.references",
    make: () => ({ id: newId(), type: "references", items: [{ id: newId(), name: "", relation: "", contact: "" }] }),
  },
  { type: "custom", icon: SquarePlus, labelKey: "sections.custom", make: () => ({ id: newId(), type: "custom", heading: "", text: "" }) },
] satisfies readonly BlockTypeMeta<ResumeSection>[]

/** Sample document — placeholder until the editor is wired to real data. */
export const SAMPLE_RESUME: ResumeDocument = {
  header: {
    name: "Dana Rivera",
    headline: "Senior Product Designer",
    contacts: [
      { id: "email", icon: Mail, value: "dana.rivera@email.com" },
      { id: "phone", icon: Phone, value: "(415) 555-0148" },
      { id: "location", icon: MapPin, value: "San Francisco, CA" },
      { id: "website", icon: Globe, value: "dana.design" },
      { id: "linkedin", icon: Link2, value: "in/danarivera" },
    ],
  },
  sections: [
    {
      id: "summary",
      type: "summary",
      text: "Senior product designer with seven years shaping data-dense B2B tools. Led two 0→1 launches and lifted activation 38% through systems thinking and rigorous research.",
    },
    {
      id: "exp1",
      type: "experience",
      role: "Senior Product Designer",
      company: "Acme Analytics",
      location: "San Francisco, CA",
      startDate: "2021",
      endDate: "Present",
      current: true,
      bullets: [
        { id: "b1", text: "Drove the end-to-end redesign of the analytics suite, cutting time-to-insight in half." },
        { id: "b2", text: "Built a 60-component design system adopted across four product teams." },
      ],
    },
    {
      id: "edu1",
      type: "education",
      school: "Rhode Island School of Design",
      degree: "BFA",
      field: "Graphic Design",
      location: "Providence, RI",
      startDate: "2013",
      endDate: "2017",
      bullets: [],
    },
    {
      id: "skills1",
      type: "skills",
      groups: [
        { id: "g1", name: "Design", items: [{ id: "s1", text: "Figma" }, { id: "s2", text: "Prototyping" }, { id: "s3", text: "Design systems" }] },
        { id: "g2", name: "Research", items: [{ id: "s4", text: "Usability testing" }, { id: "s5", text: "Surveys" }] },
      ],
    },
  ],
}
