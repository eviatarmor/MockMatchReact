import type { ResumeDocument, ResumeSection, SectionEntry } from "@/features/resume-editor/types"
import type { MentionTarget } from "../types"
import { stripHtml } from "./strip-html"

function push(parts: string[], value: string | null | undefined) {
  const t = value?.trim()
  if (t) parts.push(t)
}

function entryLabel(entry: SectionEntry, fallback: string): string {
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
      for (const e of section.entries) {
        push(parts, entryContext(e))
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

/**
 * Build @-mention targets from a resume.
 * `labelForType` maps section type → localized section name.
 */
export function buildResumeMentionTargets(
  document: ResumeDocument,
  labelForType: (type: ResumeSection["type"]) => string,
  headerLabel: string
): MentionTarget[] {
  const targets: MentionTarget[] = []

  targets.push({
    id: "header",
    label: headerLabel,
    kind: "header",
    getContext: () => {
      const parts: string[] = []
      push(parts, document.header.name)
      push(parts, document.header.headline)
      for (const c of document.header.contacts) push(parts, c.value)
      return parts.join("\n")
    },
  })

  for (const section of document.sections) {
    const typeLabel = labelForType(section.type)
    targets.push({
      id: section.id,
      label: typeLabel,
      kind: `section:${section.type}`,
      getContext: () => sectionContext(section),
    })

    if (
      section.type === "experience" ||
      section.type === "education" ||
      section.type === "projects" ||
      section.type === "volunteering"
    ) {
      for (const entry of section.entries) {
        targets.push({
          id: `entry:${section.id}:${entry.id}`,
          label: entryLabel(entry, typeLabel),
          kind: `entry:${section.type}`,
          getContext: () => entryContext(entry),
        })
      }
    }
  }

  return targets
}

/** Resolve a toolbar block id (section id) to a mention target id. */
export function resumeMentionIdForBlock(sectionId: string): string {
  return sectionId
}
