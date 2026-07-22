import { stripHtml } from "../../section-snippet"
import type { ResumeDocument, ResumeSection } from "../../types"

function push(parts: string[], value: string | null | undefined) {
  const t = value?.trim()
  if (t) parts.push(t)
}

function sectionPlain(section: ResumeSection, parts: string[]) {
  switch (section.type) {
    case "summary":
      push(parts, stripHtml(section.text))
      break
    case "experience":
    case "education":
    case "projects":
    case "volunteering":
      for (const e of section.entries) {
        push(parts, e.title)
        push(parts, e.org)
        push(parts, e.location)
        push(parts, stripHtml(e.bullets))
      }
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
        push(parts, l.name)
        push(parts, l.proficiency)
      }
      break
    case "affiliations":
      push(parts, section.organization)
      push(parts, section.role)
      break
    case "references":
      for (const r of section.items) {
        push(parts, r.name)
        push(parts, r.relation)
        push(parts, r.contact)
      }
      break
    case "custom":
      push(parts, section.heading)
      push(parts, stripHtml(section.text))
      break
  }
}

/** Flatten resume prose for Harper lint (skip emails/phones/urls-ish contacts). */
export function collectPlainText(doc: ResumeDocument): string {
  const parts: string[] = []
  push(parts, doc.header.name)
  push(parts, doc.header.headline)
  for (const section of doc.sections) sectionPlain(section, parts)
  return parts.join("\n")
}
