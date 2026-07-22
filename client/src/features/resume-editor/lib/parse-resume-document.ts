import { createBlankResumeDocument, newEntry } from "../constants"
import type {
  BulletItem,
  LanguageItem,
  ReferenceItem,
  ResumeContactEntry,
  ResumeDocument,
  ResumeSection,
  SectionEntry,
} from "../types"

function str(value: unknown): string {
  if (typeof value === "string") return value
  if (value == null) return ""
  return String(value)
}

function idOf(value: unknown): string {
  const s = str(value)
  return s || crypto.randomUUID()
}

function normalizeContact(raw: unknown): ResumeContactEntry {
  const c = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  return {
    id: idOf(c.id),
    iconKey: (str(c.iconKey) || "mail") as ResumeContactEntry["iconKey"],
    value: str(c.value),
  }
}

function normalizeEntry(raw: unknown): SectionEntry {
  const e = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  return {
    id: idOf(e.id),
    title: str(e.title),
    org: str(e.org),
    location: str(e.location),
    url: str(e.url),
    startDate: str(e.startDate),
    endDate: str(e.endDate),
    bullets: str(e.bullets),
  }
}

function normalizeBullet(raw: unknown): BulletItem {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  return { id: idOf(b.id), text: str(b.text) }
}

function normalizeLanguage(raw: unknown): LanguageItem {
  const l = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  return { id: idOf(l.id), name: str(l.name), proficiency: str(l.proficiency) }
}

function normalizeReference(raw: unknown): ReferenceItem {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  return {
    id: idOf(r.id),
    name: str(r.name),
    relation: str(r.relation),
    contact: str(r.contact),
  }
}

function normalizeSection(raw: unknown): ResumeSection | null {
  if (!raw || typeof raw !== "object") return null
  const s = raw as Record<string, unknown>
  const id = idOf(s.id)
  const type = str(s.type)

  switch (type) {
    case "summary":
      return { id, type, text: str(s.text) }
    case "experience":
    case "education":
    case "projects":
    case "volunteering": {
      const entries = Array.isArray(s.entries) ? s.entries.map(normalizeEntry) : [newEntry()]
      return { id, type, entries } as ResumeSection
    }
    case "skills":
    case "hobbies": {
      const items = Array.isArray(s.items) ? s.items.map(normalizeBullet) : [{ id: crypto.randomUUID(), text: "" }]
      return { id, type, items } as ResumeSection
    }
    case "awards":
      return {
        id,
        type,
        title: str(s.title),
        date: str(s.date),
        issuer: str(s.issuer),
        description: str(s.description),
      }
    case "certifications":
      return {
        id,
        type,
        name: str(s.name),
        date: str(s.date),
        issuer: str(s.issuer),
        credentialId: str(s.credentialId),
      }
    case "publications":
      return {
        id,
        type,
        title: str(s.title),
        date: str(s.date),
        publisher: str(s.publisher),
        url: str(s.url),
      }
    case "languages": {
      const items = Array.isArray(s.items)
        ? s.items.map(normalizeLanguage)
        : [{ id: crypto.randomUUID(), name: "", proficiency: "" }]
      return { id, type, items }
    }
    case "affiliations":
      return {
        id,
        type,
        organization: str(s.organization),
        role: str(s.role),
        date: str(s.date),
      }
    case "references": {
      const items = Array.isArray(s.items)
        ? s.items.map(normalizeReference)
        : [{ id: crypto.randomUUID(), name: "", relation: "", contact: "" }]
      return { id, type, items }
    }
    case "custom":
      return { id, type, heading: str(s.heading), text: str(s.text) }
    default:
      return null
  }
}

/**
 * Coerce unknown API/JSON into a safe {@link ResumeDocument}.
 * Missing arrays (contacts/entries/items) become empty defaults so `.map` never throws.
 */
export function parseResumeDocument(value: unknown): ResumeDocument {
  const blank = createBlankResumeDocument()
  if (!value || typeof value !== "object") return blank

  const v = value as Record<string, unknown>
  const headerRaw =
    v.header && typeof v.header === "object" ? (v.header as Record<string, unknown>) : null

  const contacts = Array.isArray(headerRaw?.contacts)
    ? headerRaw.contacts.map(normalizeContact)
    : blank.header.contacts

  const sections = Array.isArray(v.sections)
    ? v.sections.map(normalizeSection).filter((s): s is ResumeSection => s != null)
    : blank.sections

  return {
    header: {
      name: str(headerRaw?.name),
      headline: str(headerRaw?.headline),
      contacts,
    },
    sections: sections.length > 0 ? sections : blank.sections,
  }
}
