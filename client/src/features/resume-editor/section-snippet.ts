import { isBlankHtml } from "@/lib/blank-html"
import type { ResumeSection, SectionEntry } from "./types"

/** Body fields hold Lexical HTML; strip tags down to plain text for preview lines. */
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent ?? ""
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function entryIsEmpty(e: SectionEntry): boolean {
  return (
    !hasText(e.title) &&
    !hasText(e.org) &&
    !hasText(e.location) &&
    !hasText(e.url) &&
    !hasText(e.startDate) &&
    !hasText(e.endDate) &&
    isBlankHtml(e.bullets)
  )
}

/** True when a section would render nothing useful in print/export. */
export function sectionIsEmpty(section: ResumeSection): boolean {
  switch (section.type) {
    case "summary":
      return isBlankHtml(section.text)
    case "experience":
    case "education":
    case "projects":
    case "volunteering":
      return !Array.isArray(section.entries) || section.entries.length === 0 || section.entries.every(entryIsEmpty)
    case "skills":
    case "hobbies":
      return !Array.isArray(section.items) || section.items.length === 0 || section.items.every((it) => !hasText(it.text))
    case "awards":
      return (
        !hasText(section.title) &&
        !hasText(section.date) &&
        !hasText(section.issuer) &&
        isBlankHtml(section.description)
      )
    case "certifications":
      return (
        !hasText(section.name) &&
        !hasText(section.date) &&
        !hasText(section.issuer) &&
        !hasText(section.credentialId)
      )
    case "publications":
      return (
        !hasText(section.title) &&
        !hasText(section.date) &&
        !hasText(section.publisher) &&
        !hasText(section.url)
      )
    case "languages":
      return (
        !Array.isArray(section.items) ||
        section.items.length === 0 ||
        section.items.every((l) => !hasText(l.name) && !hasText(l.proficiency))
      )
    case "affiliations":
      return !hasText(section.organization) && !hasText(section.role) && !hasText(section.date)
    case "references":
      return (
        !Array.isArray(section.items) ||
        section.items.length === 0 ||
        section.items.every((r) => !hasText(r.name) && !hasText(r.relation) && !hasText(r.contact))
      )
    case "custom":
      return !hasText(section.heading) && isBlankHtml(section.text)
  }
}

/** A short, plain-text preview line for a section (used in section lists). */
export function snippet(section: ResumeSection): string {
  switch (section.type) {
    case "summary":
      return stripHtml(section.text)
    case "experience":
    case "education":
    case "projects":
    case "volunteering":
      return section.entries.map((e) => [e.title, e.org].filter(Boolean).join(" · ")).filter(Boolean).join("  •  ")
    case "skills":
      return section.items.map((s) => s.text).filter(Boolean).join(", ")
    case "awards":
      return section.title
    case "certifications":
      return section.name
    case "publications":
      return section.title
    case "languages":
      return section.items.map((l) => l.name).filter(Boolean).join(", ")
    case "affiliations":
      return section.organization
    case "hobbies":
      return section.items.map((h) => stripHtml(h.text)).filter(Boolean).join(", ")
    case "references":
      return section.items.map((r) => r.name).filter(Boolean).join(", ")
    case "custom":
      return section.heading
  }
}
