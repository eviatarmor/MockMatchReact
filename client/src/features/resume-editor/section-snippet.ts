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
