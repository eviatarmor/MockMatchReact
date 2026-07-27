import type { CoverLetterDocument } from "@/features/cover-letter-editor/types"
import type { ResumeDocument, ResumeSection } from "@/features/resume-editor/types"
import type { DocumentAiKind } from "../types"

export type TextReplacementInput = {
  readonly find: string
  readonly replacement: string
  readonly targetId?: string
}

export type TextReplacementResult =
  | { readonly ok: true; readonly document: unknown; readonly count: number }
  | { readonly ok: false; readonly reason: "empty_find" | "not_found" }

function replaceInString(
  value: string,
  find: string,
  replacement: string
): { value: string; count: number } {
  if (!value || !find || !value.includes(find)) {
    return { value, count: 0 }
  }
  let count = 0
  let next = value
  // Replace all non-overlapping occurrences.
  while (next.includes(find)) {
    next = next.replace(find, replacement)
    count += 1
    // Guard against infinite loops if replacement reintroduces find.
    if (replacement.includes(find)) break
  }
  return { value: next, count }
}

type MutableBox = { count: number }

function replaceField(
  value: string,
  find: string,
  replacement: string,
  box: MutableBox
): string {
  const result = replaceInString(value, find, replacement)
  box.count += result.count
  return result.value
}

function applyResume(
  document: ResumeDocument,
  find: string,
  replacement: string,
  targetId?: string
): TextReplacementResult {
  const box: MutableBox = { count: 0 }
  const only = targetId?.trim() || null

  let header = document.header
  if (!only || only === "header") {
    header = {
      ...header,
      name: replaceField(header.name, find, replacement, box),
      headline: replaceField(header.headline, find, replacement, box),
      contacts: header.contacts.map((c) =>
        !only || only === "header"
          ? { ...c, value: replaceField(c.value, find, replacement, box) }
          : c
      ),
    }
  }

  const sections = document.sections.map((section) => {
    if (only && only !== section.id && !only.startsWith(`entry:${section.id}:`)) {
      return section
    }
    return patchResumeSection(section, find, replacement, box, only)
  })

  if (box.count === 0) return { ok: false, reason: "not_found" }
  return { ok: true, document: { header, sections }, count: box.count }
}

function patchResumeSection(
  section: ResumeSection,
  find: string,
  replacement: string,
  box: MutableBox,
  only: string | null
): ResumeSection {
  const sectionMatch = !only || only === section.id
  const entryPrefix = only?.startsWith("entry:") ? only : null

  switch (section.type) {
    case "summary":
      if (!sectionMatch) return section
      return {
        ...section,
        text: replaceField(section.text, find, replacement, box),
      }
    case "experience":
    case "education":
    case "projects":
    case "volunteering":
      return {
        ...section,
        entries: section.entries.map((entry) => {
          if (entryPrefix && entryPrefix !== `entry:${section.id}:${entry.id}`) {
            return entry
          }
          if (!sectionMatch && !entryPrefix) return entry
          if (only === section.id || entryPrefix || !only) {
            return {
              ...entry,
              title: replaceField(entry.title, find, replacement, box),
              org: replaceField(entry.org, find, replacement, box),
              location: replaceField(entry.location, find, replacement, box),
              url: replaceField(entry.url, find, replacement, box),
              startDate: replaceField(entry.startDate, find, replacement, box),
              endDate: replaceField(entry.endDate, find, replacement, box),
              bullets: replaceField(entry.bullets, find, replacement, box),
            }
          }
          return entry
        }),
      }
    case "skills":
    case "hobbies":
      if (!sectionMatch) return section
      return {
        ...section,
        items: section.items.map((item) => ({
          ...item,
          text: replaceField(item.text, find, replacement, box),
        })),
      }
    case "awards":
      if (!sectionMatch) return section
      return {
        ...section,
        title: replaceField(section.title, find, replacement, box),
        issuer: replaceField(section.issuer, find, replacement, box),
        date: replaceField(section.date, find, replacement, box),
        description: replaceField(section.description, find, replacement, box),
      }
    case "certifications":
      if (!sectionMatch) return section
      return {
        ...section,
        name: replaceField(section.name, find, replacement, box),
        issuer: replaceField(section.issuer, find, replacement, box),
        date: replaceField(section.date, find, replacement, box),
        credentialId: replaceField(section.credentialId, find, replacement, box),
      }
    case "publications":
      if (!sectionMatch) return section
      return {
        ...section,
        title: replaceField(section.title, find, replacement, box),
        publisher: replaceField(section.publisher, find, replacement, box),
        date: replaceField(section.date, find, replacement, box),
        url: replaceField(section.url, find, replacement, box),
      }
    case "languages":
      if (!sectionMatch) return section
      return {
        ...section,
        items: section.items.map((item) => ({
          ...item,
          name: replaceField(item.name, find, replacement, box),
          proficiency: replaceField(item.proficiency, find, replacement, box),
        })),
      }
    case "affiliations":
      if (!sectionMatch) return section
      return {
        ...section,
        organization: replaceField(section.organization, find, replacement, box),
        role: replaceField(section.role, find, replacement, box),
        date: replaceField(section.date, find, replacement, box),
      }
    case "references":
      if (!sectionMatch) return section
      return {
        ...section,
        items: section.items.map((item) => ({
          ...item,
          name: replaceField(item.name, find, replacement, box),
          relation: replaceField(item.relation, find, replacement, box),
          contact: replaceField(item.contact, find, replacement, box),
        })),
      }
    case "custom":
      if (!sectionMatch) return section
      return {
        ...section,
        heading: replaceField(section.heading, find, replacement, box),
        text: replaceField(section.text, find, replacement, box),
      }
  }
}

function applyCoverLetter(
  document: CoverLetterDocument,
  find: string,
  replacement: string,
  targetId?: string
): TextReplacementResult {
  const box: MutableBox = { count: 0 }
  const only = targetId?.trim() || null

  let sender = document.sender
  let recipient = document.recipient
  let date = document.date

  if (!only || only === "sender") {
    sender = {
      ...sender,
      name: replaceField(sender.name, find, replacement, box),
      title: replaceField(sender.title, find, replacement, box),
      contacts: sender.contacts.map((c) => ({
        ...c,
        value: replaceField(c.value, find, replacement, box),
      })),
    }
  }

  if (!only || only === "recipient") {
    recipient = {
      ...recipient,
      name: recipient.name
        ? replaceField(recipient.name, find, replacement, box)
        : recipient.name,
      title: recipient.title
        ? replaceField(recipient.title, find, replacement, box)
        : recipient.title,
      company: replaceField(recipient.company, find, replacement, box),
      addressLines: recipient.addressLines?.map((line) =>
        replaceField(line, find, replacement, box)
      ),
    }
  }

  if (!only) {
    date = replaceField(date, find, replacement, box)
  }

  const blocks = document.blocks.map((block) => {
    if (only && only !== block.id) return block
    if (block.type === "signoff") {
      return {
        ...block,
        closing: replaceField(block.closing, find, replacement, box),
        signature: replaceField(block.signature, find, replacement, box),
      }
    }
    if (block.type === "custom") {
      return {
        ...block,
        heading: replaceField(block.heading, find, replacement, box),
        text: replaceField(block.text, find, replacement, box),
      }
    }
    return {
      ...block,
      text: replaceField(block.text, find, replacement, box),
    }
  })

  if (box.count === 0) return { ok: false, reason: "not_found" }
  return {
    ok: true,
    document: { sender, date, recipient, blocks },
    count: box.count,
  }
}

/** Apply a find→replace across the live document (optionally scoped by targetId). */
export function applyDocumentTextReplacement(
  kind: DocumentAiKind,
  document: unknown,
  input: TextReplacementInput
): TextReplacementResult {
  const find = input.find
  if (!find?.trim()) return { ok: false, reason: "empty_find" }

  if (kind === "resume") {
    return applyResume(document as ResumeDocument, find, input.replacement, input.targetId)
  }
  return applyCoverLetter(
    document as CoverLetterDocument,
    find,
    input.replacement,
    input.targetId
  )
}
