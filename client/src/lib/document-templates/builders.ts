import type { DocumentStyleDto } from "@mockmatch/schemas"
import type { CoverLetterDocument } from "@/features/cover-letter-editor/types"
import type { ResumeDocument, ResumeSection } from "@/features/resume-editor/types"
import type {
  CoverLetterRoleTemplate,
  ResumeRoleTemplate,
  SeedEducation,
  SeedExperience,
} from "./types"

const nid = () => crypto.randomUUID()

export function htmlBullets(items: readonly string[]): string {
  if (items.length === 0) return ""
  return `<ul class="list-disc pl-5">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
}

export function htmlParagraph(text: string): string {
  return `<p>${escapeHtml(text)}</p>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function mapExperience(entries: readonly SeedExperience[]) {
  return entries.map((entry) => ({
    id: nid(),
    title: entry.title,
    org: entry.org,
    location: entry.location,
    url: entry.url ?? "",
    startDate: entry.startDate,
    endDate: entry.endDate,
    bullets: htmlBullets(entry.bullets),
  }))
}

function mapEducation(entries: readonly SeedEducation[]) {
  return entries.map((entry) => ({
    id: nid(),
    title: entry.title,
    org: entry.org,
    location: entry.location,
    url: "",
    startDate: entry.startDate,
    endDate: entry.endDate,
    bullets: entry.bullets ? htmlBullets(entry.bullets) : "",
  }))
}

/** Expand a compact role seed into a full editor document (fresh ids every call). */
export function buildResumeDocument(template: ResumeRoleTemplate): ResumeDocument {
  const sections: ResumeSection[] = [
    {
      id: nid(),
      type: "summary",
      text: htmlParagraph(template.summary),
    },
    {
      id: nid(),
      type: "experience",
      entries: mapExperience(template.experience),
    },
    {
      id: nid(),
      type: "education",
      entries: mapEducation(template.education),
    },
    {
      id: nid(),
      type: "skills",
      items: template.skills.map((text) => ({ id: nid(), text })),
    },
  ]

  if (template.projects && template.projects.length > 0) {
    sections.push({
      id: nid(),
      type: "projects",
      entries: mapExperience(template.projects),
    })
  }

  if (template.certifications && template.certifications.length > 0) {
    for (const cert of template.certifications) {
      sections.push({
        id: nid(),
        type: "certifications",
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
        credentialId: cert.credentialId ?? "",
      })
    }
  }

  if (template.languages && template.languages.length > 0) {
    sections.push({
      id: nid(),
      type: "languages",
      items: template.languages.map((lang) => ({
        id: nid(),
        name: lang.name,
        proficiency: lang.proficiency,
      })),
    })
  }

  const contacts: ResumeDocument["header"]["contacts"][number][] = [
    { id: nid(), iconKey: "mail", value: template.person.email },
    { id: nid(), iconKey: "phone", value: template.person.phone },
    { id: nid(), iconKey: "mapPin", value: template.person.location },
    { id: nid(), iconKey: "link", value: template.person.linkedin },
  ]
  if (template.person.website) {
    contacts.push({
      id: nid(),
      iconKey: "globe",
      value: template.person.website,
    })
  }

  return {
    header: {
      name: template.person.name,
      headline: template.person.headline,
      contacts,
    },
    sections,
  }
}

export function buildCoverLetterDocument(
  template: CoverLetterRoleTemplate
): CoverLetterDocument {
  return {
    sender: {
      name: template.person.name,
      title: template.person.headline,
      contacts: [
        { id: nid(), iconKey: "mail", value: template.person.email },
        { id: nid(), iconKey: "phone", value: template.person.phone },
        { id: nid(), iconKey: "mapPin", value: template.person.location },
        { id: nid(), iconKey: "link", value: template.person.linkedin },
      ],
    },
    date: template.date,
    recipient: {
      name: template.recipient.name,
      title: template.recipient.title,
      company: template.recipient.company,
      addressLines: [...template.recipient.addressLines],
    },
    blocks: [
      { id: nid(), type: "greeting", text: htmlParagraph(template.greeting) },
      ...template.paragraphs.map((paragraph) => ({
        id: nid(),
        type: "paragraph" as const,
        text: htmlParagraph(paragraph),
      })),
      {
        id: nid(),
        type: "signoff",
        closing: htmlParagraph(template.closing),
        signature: template.person.name,
      },
    ],
  }
}

export const STYLE = {
  tech: {
    accent: "blue",
    typeface: "geist",
    heading: "plain",
    density: "compact",
  } satisfies DocumentStyleDto,
  finance: {
    accent: "slate",
    typeface: "source-serif",
    heading: "underline",
    density: "compact",
  } satisfies DocumentStyleDto,
  consulting: {
    accent: "indigo",
    typeface: "source-serif",
    heading: "plain",
    density: "normal",
  } satisfies DocumentStyleDto,
  healthcare: {
    accent: "teal",
    typeface: "geist",
    heading: "accent",
    density: "normal",
  } satisfies DocumentStyleDto,
  engineering: {
    accent: "emerald",
    typeface: "geist",
    heading: "plain",
    density: "compact",
  } satisfies DocumentStyleDto,
  legal: {
    accent: "slate",
    typeface: "newsreader",
    heading: "underline",
    density: "normal",
  } satisfies DocumentStyleDto,
  product: {
    accent: "purple",
    typeface: "geist",
    heading: "accent",
    density: "normal",
  } satisfies DocumentStyleDto,
} as const
