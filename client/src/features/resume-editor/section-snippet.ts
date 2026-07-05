import type { ResumeSection } from "./types"

/** Body fields hold Lexical HTML; strip tags down to plain text for preview lines. */
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent ?? ""
}

/** A short, plain-text preview line for a section (used in section lists). */
export function snippet(section: ResumeSection): string {
  switch (section.type) {
    case "summary":
      return stripHtml(section.text)
    case "experience":
      return [section.role, section.company].filter(Boolean).join(" · ")
    case "education":
      return [section.degree, section.school].filter(Boolean).join(" · ")
    case "skills":
      return section.groups.map((g) => g.name).filter(Boolean).join(", ")
    case "projects":
      return section.name
    case "volunteering":
      return [section.role, section.organization].filter(Boolean).join(" · ")
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
