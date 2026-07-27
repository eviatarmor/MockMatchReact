export type DocumentAiKind = "resume" | "cover_letter"

const MAX_DOCUMENT_CHARS = 24_000
const MAX_ATTACHMENT_CHARS = 4_000

export type DocumentAiAttachment = {
  id: string
  title: string
  text: string
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n…[truncated]`
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function push(parts: string[], label: string, value: string | null | undefined) {
  const t = value?.trim()
  if (!t) return
  parts.push(`${label}: ${t}`)
}

/** Best-effort plain serialization of resume/cover-letter JSON snapshots. */
export function serializeDocument(
  kind: DocumentAiKind,
  document: unknown
): string {
  if (document == null || typeof document !== "object") {
    return "(empty document)"
  }

  const doc = document as Record<string, unknown>
  const parts: string[] = []

  if (kind === "resume") {
    const header = doc.header as Record<string, unknown> | undefined
    if (header && typeof header === "object") {
      push(parts, "Name", String(header.name ?? ""))
      push(parts, "Headline", String(header.headline ?? ""))
      const contacts = Array.isArray(header.contacts) ? header.contacts : []
      for (const c of contacts) {
        if (c && typeof c === "object") {
          const entry = c as Record<string, unknown>
          push(parts, "Contact", String(entry.value ?? ""))
        }
      }
    }

    const sections = Array.isArray(doc.sections) ? doc.sections : []
    for (const raw of sections) {
      if (!raw || typeof raw !== "object") continue
      const section = raw as Record<string, unknown>
      const type = String(section.type ?? "section")
      parts.push(`\n## ${type} (id=${String(section.id ?? "")})`)
      serializeResumeSection(section, parts)
    }
  } else {
    const sender = doc.sender as Record<string, unknown> | undefined
    if (sender && typeof sender === "object") {
      push(parts, "Sender name", String(sender.name ?? ""))
      push(parts, "Sender title", String(sender.title ?? ""))
    }
    push(parts, "Date", String(doc.date ?? ""))
    const recipient = doc.recipient as Record<string, unknown> | undefined
    if (recipient && typeof recipient === "object") {
      push(parts, "Recipient name", String(recipient.name ?? ""))
      push(parts, "Recipient title", String(recipient.title ?? ""))
      push(parts, "Company", String(recipient.company ?? ""))
    }

    const blocks = Array.isArray(doc.blocks) ? doc.blocks : []
    for (const raw of blocks) {
      if (!raw || typeof raw !== "object") continue
      const block = raw as Record<string, unknown>
      const type = String(block.type ?? "block")
      parts.push(`\n## ${type} (id=${String(block.id ?? "")})`)
      if (type === "signoff") {
        push(parts, "Closing", stripHtml(String(block.closing ?? "")))
        push(parts, "Signature", String(block.signature ?? ""))
      } else if (type === "custom") {
        push(parts, "Heading", String(block.heading ?? ""))
        push(parts, "Text", stripHtml(String(block.text ?? "")))
      } else {
        push(parts, "Text", stripHtml(String(block.text ?? "")))
      }
    }
  }

  return truncate(parts.join("\n").trim() || "(empty document)", MAX_DOCUMENT_CHARS)
}

function serializeResumeSection(
  section: Record<string, unknown>,
  parts: string[]
) {
  const type = String(section.type ?? "")
  switch (type) {
    case "summary":
      push(parts, "Text", stripHtml(String(section.text ?? "")))
      break
    case "experience":
    case "education":
    case "projects":
    case "volunteering": {
      const entries = Array.isArray(section.entries) ? section.entries : []
      for (const raw of entries) {
        if (!raw || typeof raw !== "object") continue
        const e = raw as Record<string, unknown>
        parts.push(
          `- Entry (id=${String(e.id ?? "")}): ${[e.title, e.org].filter(Boolean).join(" · ")}`
        )
        push(parts, "  Location", String(e.location ?? ""))
        push(parts, "  Dates", [e.startDate, e.endDate].filter(Boolean).join(" – "))
        push(parts, "  URL", String(e.url ?? ""))
        push(parts, "  Body", stripHtml(String(e.bullets ?? "")))
      }
      break
    }
    case "skills":
    case "hobbies": {
      const items = Array.isArray(section.items) ? section.items : []
      const labels = items
        .map((it) =>
          it && typeof it === "object"
            ? String((it as Record<string, unknown>).text ?? "")
            : ""
        )
        .filter(Boolean)
      if (labels.length) parts.push(labels.join(", "))
      break
    }
    case "awards":
      push(parts, "Title", String(section.title ?? ""))
      push(parts, "Issuer", String(section.issuer ?? ""))
      push(parts, "Date", String(section.date ?? ""))
      push(parts, "Description", stripHtml(String(section.description ?? "")))
      break
    case "certifications":
      push(parts, "Name", String(section.name ?? ""))
      push(parts, "Issuer", String(section.issuer ?? ""))
      push(parts, "Date", String(section.date ?? ""))
      push(parts, "Credential", String(section.credentialId ?? ""))
      break
    case "publications":
      push(parts, "Title", String(section.title ?? ""))
      push(parts, "Publisher", String(section.publisher ?? ""))
      push(parts, "Date", String(section.date ?? ""))
      push(parts, "URL", String(section.url ?? ""))
      break
    case "languages": {
      const items = Array.isArray(section.items) ? section.items : []
      for (const raw of items) {
        if (!raw || typeof raw !== "object") continue
        const l = raw as Record<string, unknown>
        parts.push(`- ${String(l.name ?? "")}: ${String(l.proficiency ?? "")}`)
      }
      break
    }
    case "affiliations":
      push(parts, "Organization", String(section.organization ?? ""))
      push(parts, "Role", String(section.role ?? ""))
      push(parts, "Date", String(section.date ?? ""))
      break
    case "references": {
      const items = Array.isArray(section.items) ? section.items : []
      for (const raw of items) {
        if (!raw || typeof raw !== "object") continue
        const r = raw as Record<string, unknown>
        parts.push(
          `- ${String(r.name ?? "")} (${String(r.relation ?? "")}) ${String(r.contact ?? "")}`
        )
      }
      break
    }
    case "custom":
      push(parts, "Heading", String(section.heading ?? ""))
      push(parts, "Text", stripHtml(String(section.text ?? "")))
      break
    default:
      parts.push(JSON.stringify(section).slice(0, 800))
  }
}

export function buildDocumentAiSystemPrompt(input: {
  kind: DocumentAiKind
  document: unknown
  attachments?: DocumentAiAttachment[]
}): string {
  const kindLabel = input.kind === "resume" ? "resume" : "cover letter"
  const docText = serializeDocument(input.kind, input.document)

  const attachmentLines =
    input.attachments && input.attachments.length > 0
      ? input.attachments
          .map(
            (a) =>
              `- ${a.title} [id=${a.id}]\n  ${truncate(a.text.trim() || "(empty)", MAX_ATTACHMENT_CHARS / Math.max(input.attachments!.length, 1))}`
          )
          .join("\n")
      : "(none)"

  return [
    `You are MockMatch Document AI — a writing coach inside the ${kindLabel} editor.`,
    "Help the user improve structure, clarity, impact, grammar, and tailoring.",
    "Be concise and practical.",
    "When the user attaches selected text or a section, prioritize that focus.",
    "Do not invent employment history, degrees, metrics, or employers the document does not support.",
    "Stay on resume/cover-letter writing topics. Decline unrelated harmful requests.",
    "",
    "## Applying edits",
    "You have a tool `replace_document_text` that proposes a find→replace in the live document.",
    "The user must approve each replacement in the UI before it is applied.",
    "Use the tool when the user wants a rewrite written into the document (e.g. improve this bullet, fix grammar, replace selection).",
    "Set `find` to an exact contiguous substring from the current document (prefer the selected or attached text).",
    "Set `replacement` to the improved text. Optionally set `targetId` and `locationLabel` for clarity.",
    "You may still explain the change in chat; do not claim the document was edited until the tool is approved.",
    "If no exact match exists, ask the user to select text or clarify instead of inventing a find string.",
    "",
    `## Current ${kindLabel} document`,
    docText,
    "",
    "## Focus attachments",
    attachmentLines,
  ].join("\n")
}
