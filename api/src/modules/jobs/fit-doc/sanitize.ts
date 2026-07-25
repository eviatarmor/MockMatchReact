import { randomUUID } from "node:crypto"
import type {
  CoverLetterDocumentDto,
  ResumeDocumentDto,
} from "@mockmatch/schemas"
import {
  coverLetterDocumentSchema,
  resumeDocumentSchema,
} from "@mockmatch/schemas"
import { ensureIdsDeep } from "./openrouter-json.js"

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value)
}

type ContactIconKey = "mail" | "phone" | "mapPin" | "globe" | "link"

function coerceContact(raw: unknown): {
  id: string
  iconKey: ContactIconKey
  value: string
} {
  const c = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const iconRaw = asString(c.iconKey)
  const iconKey: ContactIconKey = (
    ["mail", "phone", "mapPin", "globe", "link"] as const
  ).includes(iconRaw as ContactIconKey)
    ? (iconRaw as ContactIconKey)
    : "link"
  return {
    id: typeof c.id === "string" && c.id ? c.id : randomUUID(),
    iconKey,
    value: asString(c.value),
  }
}

function coerceEntry(raw: unknown) {
  const e = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const bullets =
    typeof e.bullets === "string"
      ? e.bullets
      : Array.isArray(e.bullets)
        ? e.bullets
            .map((b) =>
              typeof b === "string"
                ? b
                : b && typeof b === "object" && "text" in b
                  ? asString((b as { text?: unknown }).text)
                  : ""
            )
            .filter(Boolean)
            .join("\n")
        : ""
  return {
    id: typeof e.id === "string" && e.id ? e.id : randomUUID(),
    title: asString(e.title),
    org: asString(e.org),
    location: asString(e.location),
    url: asString(e.url),
    startDate: asString(e.startDate),
    endDate: asString(e.endDate),
    bullets,
  }
}

/** Coerce + validate AI resume JSON; clamp contacts to source when provided. */
export function sanitizeResumeDocument(
  raw: unknown,
  source: ResumeDocumentDto | null,
  allowedSkills: Set<string>
): ResumeDocumentDto {
  const rooted = ensureIdsDeep(raw) as Record<string, unknown>
  const doc =
    rooted.document && typeof rooted.document === "object"
      ? (rooted.document as Record<string, unknown>)
      : rooted

  const headerIn =
    doc.header && typeof doc.header === "object"
      ? (doc.header as Record<string, unknown>)
      : {}

  const sourceContacts = source?.header.contacts ?? []
  const aiContacts = Array.isArray(headerIn.contacts)
    ? headerIn.contacts.map(coerceContact)
    : []

  // Prefer source contacts (no hallucinated email/phone)
  const contacts =
    sourceContacts.length > 0
      ? sourceContacts.map((c) => ({ ...c }))
      : aiContacts.length > 0
        ? aiContacts
        : [
            { id: "email", iconKey: "mail" as const, value: "" },
            { id: "phone", iconKey: "phone" as const, value: "" },
          ]

  const sectionsIn = Array.isArray(doc.sections) ? doc.sections : []
  const sections: ResumeDocumentDto["sections"] = []

  for (const rawSection of sectionsIn) {
    if (!rawSection || typeof rawSection !== "object") continue
    const s = rawSection as Record<string, unknown>
    const type = asString(s.type)
    const id = typeof s.id === "string" && s.id ? s.id : randomUUID()

    if (type === "summary") {
      sections.push({ id, type: "summary", text: asString(s.text) })
      continue
    }
    if (type === "experience" || type === "education" || type === "projects" || type === "volunteering") {
      sections.push({
        id,
        type,
        entries: Array.isArray(s.entries) ? s.entries.map(coerceEntry) : [],
      })
      continue
    }
    if (type === "skills") {
      const items = Array.isArray(s.items)
        ? s.items
            .map((it) => {
              const item =
                it && typeof it === "object" ? (it as Record<string, unknown>) : {}
              return {
                id: typeof item.id === "string" && item.id ? item.id : randomUUID(),
                text: asString(item.text),
              }
            })
            .filter((it) => it.text.trim())
            // Soft filter: keep skills that appear in bank or look like short labels
            .filter((it) => {
              if (allowedSkills.size === 0) return true
              const norm = it.text.toLowerCase().trim()
              if (allowedSkills.has(norm)) return true
              // Allow job-keyword chips already evidenced in bank via substring
              for (const a of allowedSkills) {
                if (norm.includes(a) || a.includes(norm)) return true
              }
              return it.text.length <= 40
            })
        : []
      sections.push({ id, type: "skills", items })
      continue
    }
    if (type === "languages") {
      sections.push({
        id,
        type: "languages",
        items: Array.isArray(s.items)
          ? s.items.map((it) => {
              const item =
                it && typeof it === "object" ? (it as Record<string, unknown>) : {}
              return {
                id: typeof item.id === "string" && item.id ? item.id : randomUUID(),
                name: asString(item.name),
                proficiency: asString(item.proficiency),
              }
            })
          : [],
      })
      continue
    }
    if (type === "custom") {
      sections.push({
        id,
        type: "custom",
        heading: asString(s.heading),
        text: asString(s.text),
      })
    }
    // skip exotic types AI invents without schema fidelity
  }

  // Guard: restore experience from source if AI wiped it
  const hasExp = sections.some(
    (sec) => sec.type === "experience" && sec.entries.some((e) => e.title || e.org)
  )
  if (!hasExp && source) {
    const srcExp = source.sections.find((sec) => sec.type === "experience")
    if (srcExp && srcExp.type === "experience") {
      sections.unshift(structuredClone(srcExp))
    }
  }

  if (sections.length === 0 && source) {
    return structuredClone(source)
  }

  const candidate: ResumeDocumentDto = {
    header: {
      name: asString(headerIn.name) || source?.header.name || "",
      headline: asString(headerIn.headline) || source?.header.headline || "",
      contacts,
    },
    sections:
      sections.length > 0
        ? sections
        : source?.sections ?? [
            { id: randomUUID(), type: "summary", text: "" },
          ],
  }

  const parsed = resumeDocumentSchema.safeParse(candidate)
  if (!parsed.success) {
    if (source) return structuredClone(source)
    throw new Error(`Resume schema invalid: ${parsed.error.message}`)
  }
  return parsed.data
}

export function sanitizeCoverLetterDocument(
  raw: unknown,
  source: CoverLetterDocumentDto | null,
  jobCompany: string
): CoverLetterDocumentDto {
  const rooted = ensureIdsDeep(raw) as Record<string, unknown>
  const doc =
    rooted.document && typeof rooted.document === "object"
      ? (rooted.document as Record<string, unknown>)
      : rooted

  const senderIn =
    doc.sender && typeof doc.sender === "object"
      ? (doc.sender as Record<string, unknown>)
      : {}
  const recipientIn =
    doc.recipient && typeof doc.recipient === "object"
      ? (doc.recipient as Record<string, unknown>)
      : {}

  const sourceContacts = source?.sender.contacts ?? []
  const contacts =
    sourceContacts.length > 0
      ? sourceContacts.map((c) => ({ ...c }))
      : Array.isArray(senderIn.contacts)
        ? senderIn.contacts.map(coerceContact)
        : []

  const blocksIn = Array.isArray(doc.blocks) ? doc.blocks : []
  const blocks: CoverLetterDocumentDto["blocks"] = []

  for (const rawBlock of blocksIn) {
    if (!rawBlock || typeof rawBlock !== "object") continue
    const b = rawBlock as Record<string, unknown>
    const type = asString(b.type)
    const id = typeof b.id === "string" && b.id ? b.id : randomUUID()
    if (type === "greeting") {
      blocks.push({ id, type: "greeting", text: asString(b.text) })
    } else if (type === "paragraph") {
      blocks.push({ id, type: "paragraph", text: asString(b.text) })
    } else if (type === "subject") {
      blocks.push({ id, type: "subject", text: asString(b.text) })
    } else if (type === "signoff") {
      blocks.push({
        id,
        type: "signoff",
        closing: asString(b.closing) || "Sincerely,",
        signature: asString(b.signature) || asString(senderIn.name) || source?.sender.name || "",
      })
    } else if (type === "custom") {
      blocks.push({
        id,
        type: "custom",
        heading: asString(b.heading),
        text: asString(b.text),
      })
    }
  }

  if (blocks.filter((b) => b.type === "paragraph").length === 0 && source) {
    return {
      ...structuredClone(source),
      recipient: {
        ...source.recipient,
        company: jobCompany || source.recipient.company,
      },
    }
  }

  const candidate: CoverLetterDocumentDto = {
    sender: {
      name: asString(senderIn.name) || source?.sender.name || "",
      title: asString(senderIn.title) || source?.sender.title || "",
      contacts,
    },
    date: asString(doc.date) || source?.date || new Date().toISOString().slice(0, 10),
    recipient: {
      name: asString(recipientIn.name) || source?.recipient.name || "",
      title: asString(recipientIn.title) || source?.recipient.title || "",
      company: jobCompany || asString(recipientIn.company) || source?.recipient.company || "",
      addressLines: Array.isArray(recipientIn.addressLines)
        ? recipientIn.addressLines.map(asString)
        : source?.recipient.addressLines,
    },
    blocks:
      blocks.length > 0
        ? blocks
        : source?.blocks ?? [
            { id: randomUUID(), type: "greeting", text: "Dear Hiring Manager," },
            { id: randomUUID(), type: "paragraph", text: "" },
            {
              id: randomUUID(),
              type: "signoff",
              closing: "Sincerely,",
              signature: "",
            },
          ],
  }

  const parsed = coverLetterDocumentSchema.safeParse(candidate)
  if (!parsed.success) {
    if (source) {
      return {
        ...structuredClone(source),
        recipient: {
          ...source.recipient,
          company: jobCompany || source.recipient.company,
        },
      }
    }
    throw new Error(`Cover letter schema invalid: ${parsed.error.message}`)
  }
  return parsed.data
}
