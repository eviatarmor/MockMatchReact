import type { LucideIcon } from "lucide-react"
import { Contact } from "lucide-react"
import type {
  CoverLetterDocumentDto,
  ResumeDocumentDto,
} from "@mockmatch/schemas"
import type { DocumentAiKind } from "../types"
import { stripHtml } from "./strip-html"

type ResumeDocument = ResumeDocumentDto
type ResumeSection = ResumeDocumentDto["sections"][number]
type SectionEntry = Extract<
  ResumeSection,
  { entries: unknown }
>["entries"][number]
type CoverLetterDocument = CoverLetterDocumentDto
type LetterBlock = CoverLetterDocumentDto["blocks"][number]

/** Generic icon for all targets — host can restyle via CSS; keeps package free of feature constants. */
const DEFAULT_ICON = Contact as LucideIcon

export type ResolvedTargetAttachment = {
  readonly title: string
  readonly text: string
  readonly targetId: string
  readonly primaryLabel: string
  readonly groupLabel?: string
  readonly icon: LucideIcon
}

function push(parts: string[], value: string | null | undefined) {
  const t = value?.trim()
  if (t) parts.push(t)
}

function entryPrimaryLabel(entry: SectionEntry, fallback: string): string {
  const line = [entry.title, entry.org].filter((x) => x?.trim()).join(" · ")
  return line || fallback
}

function entryContext(entry: SectionEntry): string {
  const parts: string[] = []
  push(parts, entry.title)
  push(parts, entry.org)
  push(parts, entry.location)
  push(parts, [entry.startDate, entry.endDate].filter(Boolean).join(" – "))
  push(parts, entry.url)
  push(parts, stripHtml(entry.bullets))
  return parts.join("\n")
}

function sectionContext(section: ResumeSection): string {
  const parts: string[] = []
  switch (section.type) {
    case "summary":
      push(parts, stripHtml(section.text))
      break
    case "experience":
    case "education":
    case "projects":
    case "volunteering":
      for (const e of section.entries) push(parts, entryContext(e))
      break
    case "skills":
    case "hobbies":
      for (const item of section.items) push(parts, item.text)
      break
    case "awards":
      push(parts, section.title)
      push(parts, section.issuer)
      push(parts, stripHtml(section.description))
      break
    case "certifications":
      push(parts, section.name)
      push(parts, section.issuer)
      break
    case "publications":
      push(parts, section.title)
      push(parts, section.publisher)
      break
    case "languages":
      for (const l of section.items) {
        push(parts, [l.name, l.proficiency].filter(Boolean).join(": "))
      }
      break
    case "affiliations":
      push(parts, section.organization)
      push(parts, section.role)
      break
    case "references":
      for (const r of section.items) {
        push(parts, [r.name, r.relation, r.contact].filter(Boolean).join(" · "))
      }
      break
    case "custom":
      push(parts, section.heading)
      push(parts, stripHtml(section.text))
      break
  }
  return parts.join("\n")
}

function blockContext(block: LetterBlock): string {
  const parts: string[] = []
  switch (block.type) {
    case "greeting":
    case "paragraph":
    case "subject":
      push(parts, stripHtml(block.text))
      break
    case "signoff":
      push(parts, stripHtml(block.closing))
      push(parts, block.signature)
      break
    case "custom":
      push(parts, block.heading)
      push(parts, stripHtml(block.text))
      break
  }
  return parts.join("\n")
}

/**
 * Resolve plain-text content for a block/section id (toolbar AI click)
 * so it can be staged as a selection-style attachment.
 */
export function resolveTargetAttachment(
  kind: DocumentAiKind,
  document: unknown,
  targetId: string
): ResolvedTargetAttachment | null {
  const id = targetId.trim()
  if (!id || document == null) return null

  if (kind === "resume") {
    const doc = document as ResumeDocument
    if (id === "header") {
      const parts: string[] = []
      push(parts, doc.header.name)
      push(parts, doc.header.headline)
      for (const c of doc.header.contacts) push(parts, c.value)
      const text = parts.join("\n").trim()
      if (!text) return null
      return {
        title: "Header",
        text,
        targetId: id,
        primaryLabel: "Header",
        icon: Contact,
      }
    }

    // entry:sectionId:entryId
    if (id.startsWith("entry:")) {
      const [, sectionId, entryId] = id.split(":")
      const section = doc.sections.find((s) => s.id === sectionId)
      if (
        !section ||
        (section.type !== "experience" &&
          section.type !== "education" &&
          section.type !== "projects" &&
          section.type !== "volunteering")
      ) {
        return null
      }
      const entry = section.entries.find((e) => e.id === entryId)
      if (!entry) return null
      const typeLabel = section.type
      const primary = entryPrimaryLabel(entry, typeLabel)
      const text = entryContext(entry).trim()
      if (!text) return null
      return {
        title: `${typeLabel} / ${primary}`,
        text,
        targetId: id,
        primaryLabel: primary,
        groupLabel: typeLabel,
        icon: DEFAULT_ICON,
      }
    }

    const section = doc.sections.find((s) => s.id === id)
    if (!section) return null
    const text = sectionContext(section).trim()
    if (!text) return null
    return {
      title: section.type,
      text,
      targetId: id,
      primaryLabel: section.type,
      icon: DEFAULT_ICON,
    }
  }

  const doc = document as CoverLetterDocument
  if (id === "sender") {
    const parts: string[] = []
    push(parts, doc.sender.name)
    push(parts, doc.sender.title)
    for (const c of doc.sender.contacts) push(parts, c.value)
    const text = parts.join("\n").trim()
    if (!text) return null
    return {
      title: "Sender",
      text,
      targetId: id,
      primaryLabel: "Sender",
      icon: Contact,
    }
  }
  if (id === "recipient") {
    const parts: string[] = []
    push(parts, doc.recipient.name)
    push(parts, doc.recipient.title)
    push(parts, doc.recipient.company)
    if (doc.recipient.addressLines) {
      for (const line of doc.recipient.addressLines) push(parts, line)
    }
    const text = parts.join("\n").trim()
    if (!text) return null
    return {
      title: "Recipient",
      text,
      targetId: id,
      primaryLabel: "Recipient",
      icon: Contact,
    }
  }

  const block = doc.blocks.find((b) => b.id === id)
  if (!block) return null
  const text = blockContext(block).trim()
  if (!text) return null
  return {
    title: block.type,
    text,
    targetId: id,
    primaryLabel: block.type,
    icon: DEFAULT_ICON,
  }
}
