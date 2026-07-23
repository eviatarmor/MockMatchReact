import { randomUUID } from "node:crypto"
import { TRPCError } from "@trpc/server"
import {
  coverLetterDocumentSchema,
  resumeDocumentSchema,
  type CoverLetterDocumentDto,
  type ResumeDocumentDto,
  PDF_IMPORT_MAX_BYTES,
} from "@mockmatch/schemas"
import { z } from "zod"
import { env } from "../config/env.js"
import { logger } from "./logger.js"
import { getOpenRouter } from "./openrouter.js"
import { extractPdfText } from "./pdf-text.js"

const resumeImportResultSchema = z.object({
  title: z.string().min(1).max(200),
  targetRole: z.string().max(200).nullable().optional(),
  document: resumeDocumentSchema,
})

const coverLetterImportResultSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().max(200).nullable().optional(),
  document: coverLetterDocumentSchema,
})

export type ResumeImportResult = z.infer<typeof resumeImportResultSchema>
export type CoverLetterImportResult = z.infer<typeof coverLetterImportResultSchema>

function requireOpenRouterKey(): void {
  if (!env.OPENROUTER_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "PDF import is not configured (missing OPENROUTER_API_KEY).",
    })
  }
}

/** Decode and size-check base64 PDF payload. */
export function decodePdfBase64(pdfBase64: string): Uint8Array {
  const cleaned = pdfBase64.replace(/\s+/g, "")
  let buffer: Buffer
  try {
    buffer = Buffer.from(cleaned, "base64")
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid PDF data.",
    })
  }
  if (buffer.byteLength === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "PDF is empty." })
  }
  if (buffer.byteLength > PDF_IMPORT_MAX_BYTES) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: `PDF must be under ${Math.floor(PDF_IMPORT_MAX_BYTES / (1024 * 1024))} MB.`,
    })
  }
  // %PDF magic
  const head = buffer.subarray(0, 5).toString("utf8")
  if (!head.startsWith("%PDF")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File does not look like a PDF.",
    })
  }
  return new Uint8Array(buffer)
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced?.[1]?.trim() ?? trimmed
}

/** Pull outer `{...}` when model adds prose before/after JSON. */
function extractJsonObject(raw: string): string {
  const stripped = stripJsonFences(raw)
  const start = stripped.indexOf("{")
  const end = stripped.lastIndexOf("}")
  if (start === -1 || end <= start) return stripped
  return stripped.slice(start, end + 1)
}

/** Common model JSON nits: trailing commas, smart quotes. */
function repairJsonLoose(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
}

/**
 * Parse model output as JSON with light recovery.
 * Full resumes often produce large payloads — models truncate or leak fences.
 */
function parseModelJson(raw: string): unknown {
  const candidates = [
    stripJsonFences(raw),
    extractJsonObject(raw),
    repairJsonLoose(extractJsonObject(raw)),
  ]
  let lastError: unknown
  for (const candidate of candidates) {
    if (!candidate.trim()) continue
    try {
      return JSON.parse(candidate) as unknown
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error("JSON parse failed")
}

function ensureId(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : randomUUID()
}

/** Walk imported JSON and ensure every object `id` is a non-empty string. */
function ensureIdsDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(ensureIdsDeep)
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const next: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(obj)) {
      next[key] = key === "id" ? ensureId(child) : ensureIdsDeep(child)
    }
    if (!("id" in next) && "type" in next) {
      // section/block objects must have ids
      next.id = randomUUID()
    }
    return next
  }
  return value
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value)
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => asString(item)).filter(Boolean)
}

function coerceContact(raw: unknown): Record<string, unknown> {
  const c = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const iconRaw = asString(c.iconKey)
  const iconKey = ["mail", "phone", "mapPin", "globe", "link"].includes(iconRaw)
    ? iconRaw
    : "link"
  return {
    id: ensureId(c.id),
    iconKey,
    value: asString(c.value),
  }
}

function coerceSectionEntry(raw: unknown): Record<string, unknown> {
  const e = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    id: ensureId(e.id),
    title: asString(e.title),
    org: asString(e.org),
    location: asString(e.location),
    url: asString(e.url),
    startDate: asString(e.startDate),
    endDate: asString(e.endDate),
    bullets: asString(e.bullets),
  }
}

function coerceResumeDocument(raw: unknown): unknown {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const doc =
    root.document && typeof root.document === "object"
      ? (root.document as Record<string, unknown>)
      : root
  const header =
    doc.header && typeof doc.header === "object"
      ? (doc.header as Record<string, unknown>)
      : {}
  const sections = Array.isArray(doc.sections) ? doc.sections : []

  const coerceSection = (rawSection: unknown): Record<string, unknown> | null => {
    const s =
      rawSection && typeof rawSection === "object"
        ? (rawSection as Record<string, unknown>)
        : null
    if (!s || typeof s.type !== "string") return null
    const base = { id: ensureId(s.id), type: s.type }
    switch (s.type) {
      case "summary":
        return { ...base, text: asString(s.text) }
      case "experience":
      case "education":
      case "projects":
      case "volunteering":
        return {
          ...base,
          entries: Array.isArray(s.entries) ? s.entries.map(coerceSectionEntry) : [],
        }
      case "skills":
      case "hobbies":
        return {
          ...base,
          items: Array.isArray(s.items)
            ? s.items.map((it) => {
                const item = it && typeof it === "object" ? (it as Record<string, unknown>) : {}
                return { id: ensureId(item.id), text: asString(item.text) }
              })
            : [],
        }
      case "awards":
        return {
          ...base,
          title: asString(s.title),
          issuer: asString(s.issuer),
          date: asString(s.date),
          description: asString(s.description),
        }
      case "certifications":
        return {
          ...base,
          name: asString(s.name),
          issuer: asString(s.issuer),
          date: asString(s.date),
          credentialId: asString(s.credentialId),
        }
      case "publications":
        return {
          ...base,
          title: asString(s.title),
          publisher: asString(s.publisher),
          date: asString(s.date),
          url: asString(s.url),
        }
      case "languages":
        return {
          ...base,
          items: Array.isArray(s.items)
            ? s.items.map((it) => {
                const item = it && typeof it === "object" ? (it as Record<string, unknown>) : {}
                return {
                  id: ensureId(item.id),
                  name: asString(item.name),
                  proficiency: asString(item.proficiency),
                }
              })
            : [],
        }
      case "affiliations":
        return {
          ...base,
          organization: asString(s.organization),
          role: asString(s.role),
          date: asString(s.date),
        }
      case "references":
        return {
          ...base,
          items: Array.isArray(s.items)
            ? s.items.map((it) => {
                const item = it && typeof it === "object" ? (it as Record<string, unknown>) : {}
                return {
                  id: ensureId(item.id),
                  name: asString(item.name),
                  relation: asString(item.relation),
                  contact: asString(item.contact),
                }
              })
            : [],
        }
      case "custom":
        return { ...base, heading: asString(s.heading), text: asString(s.text) }
      default:
        return null
    }
  }

  return {
    title: asString(root.title) || "Imported resume",
    targetRole: root.targetRole == null ? null : asString(root.targetRole) || null,
    document: {
      header: {
        name: asString(header.name),
        headline: asString(header.headline),
        contacts: Array.isArray(header.contacts)
          ? header.contacts.map(coerceContact)
          : [],
      },
      sections: sections.map(coerceSection).filter(Boolean),
    },
  }
}

function coerceCoverLetterDocument(raw: unknown): unknown {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const doc =
    root.document && typeof root.document === "object"
      ? (root.document as Record<string, unknown>)
      : root
  const sender =
    doc.sender && typeof doc.sender === "object"
      ? (doc.sender as Record<string, unknown>)
      : {}
  const recipient =
    doc.recipient && typeof doc.recipient === "object"
      ? (doc.recipient as Record<string, unknown>)
      : {}
  const blocks = Array.isArray(doc.blocks) ? doc.blocks : []

  const coerceBlock = (rawBlock: unknown): Record<string, unknown> | null => {
    const b =
      rawBlock && typeof rawBlock === "object"
        ? (rawBlock as Record<string, unknown>)
        : null
    if (!b || typeof b.type !== "string") return null
    const base = { id: ensureId(b.id), type: b.type }
    switch (b.type) {
      case "greeting":
      case "paragraph":
      case "subject":
        return { ...base, text: asString(b.text) }
      case "signoff":
        return {
          ...base,
          closing: asString(b.closing),
          signature: asString(b.signature),
        }
      case "custom":
        return { ...base, heading: asString(b.heading), text: asString(b.text) }
      default:
        return null
    }
  }

  return {
    title: asString(root.title) || "Imported cover letter",
    company: root.company == null ? null : asString(root.company) || null,
    document: {
      sender: {
        name: asString(sender.name),
        title: asString(sender.title),
        contacts: Array.isArray(sender.contacts)
          ? sender.contacts.map(coerceContact)
          : [],
      },
      date: asString(doc.date),
      recipient: {
        name: recipient.name == null ? undefined : asString(recipient.name),
        title: recipient.title == null ? undefined : asString(recipient.title),
        company: asString(recipient.company),
        addressLines: asStringArray(recipient.addressLines),
      },
      blocks: blocks.map(coerceBlock).filter(Boolean),
    },
  }
}

function defaultTitleFromFilename(filename: string, fallback: string): string {
  const base = filename.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim()
  return base.slice(0, 200) || fallback
}

const RESUME_SYSTEM = `You convert resume plain text into a single JSON object for MockMatch.

Return ONLY valid JSON (no markdown) with this shape:
{
  "title": string,            // short document title (e.g. "Jane Doe — Software Engineer")
  "targetRole": string|null,  // role if clear, else null
  "document": {
    "header": {
      "name": string,
      "headline": string,
      "contacts": [{ "id": string, "iconKey": "mail"|"phone"|"mapPin"|"globe"|"link", "value": string }]
    },
    "sections": [ /* discriminated by type */ ]
  }
}

Section types (use only these):
- { "type":"summary", "id", "text" }  // HTML ok: <p>
- { "type":"experience"|"education"|"projects"|"volunteering", "id", "entries": [{ "id","title","org","location","url","startDate","endDate","bullets" }] }
  - bullets is HTML string (prefer <ul><li>…</li></ul>)
- { "type":"skills"|"hobbies", "id", "items": [{ "id","text" }] }
- { "type":"awards", "id", "title","issuer","date","description" }
- { "type":"certifications", "id", "name","issuer","date","credentialId" }
- { "type":"publications", "id", "title","publisher","date","url" }
- { "type":"languages", "id", "items": [{ "id","name","proficiency" }] }
- { "type":"affiliations", "id", "organization","role","date" }
- { "type":"references", "id", "items": [{ "id","name","relation","contact" }] }
- { "type":"custom", "id", "heading","text" }

Rules:
- Invent stable unique string ids (uuid-like) for every id field.
- Use empty string for unknown optional text fields — never omit required keys.
- Preserve facts from the source; do not invent employers or degrees.
- Prefer experience, education, skills, summary when present.
- iconKey: mail for emails, phone for phones, mapPin for locations, globe for websites, link for LinkedIn/GitHub/etc.
- Valid JSON only: double-quoted keys/strings, no trailing commas, escape quotes inside strings.
- Keep HTML simple; avoid unescaped control characters. Merge spaced-out letters in names (e.g. "J O H N" → "JOHN").
- Stay concise: omit empty sections; bullets max ~6 per entry.`

const COVER_LETTER_SYSTEM = `You convert cover letter plain text into a single JSON object for MockMatch.

Return ONLY valid JSON (no markdown) with this shape:
{
  "title": string,
  "company": string|null,
  "document": {
    "sender": {
      "name": string,
      "title": string,
      "contacts": [{ "id": string, "iconKey": "mail"|"phone"|"mapPin"|"globe"|"link", "value": string }]
    },
    "date": string,
    "recipient": {
      "name": string (optional),
      "title": string (optional),
      "company": string,
      "addressLines": string[] (optional)
    },
    "blocks": [ /* discriminated by type */ ]
  }
}

Block types (use only these):
- { "type":"greeting", "id", "text" }     // HTML ok
- { "type":"subject", "id", "text" }
- { "type":"paragraph", "id", "text" }   // HTML ok
- { "type":"signoff", "id", "closing", "signature" }  // closing HTML ok
- { "type":"custom", "id", "heading", "text" }

Rules:
- Invent stable unique string ids for every id field.
- Use empty string for unknown text — never omit required keys.
- Preserve the letter content; do not invent company names if missing (use "").
- Split body into greeting, one or more paragraphs, and signoff when possible.`

/** Cap extracted PDF text so prompt stays bounded (model still sees full core content). */
const IMPORT_TEXT_MAX_CHARS = 40_000
/** Resume JSON with HTML bullets can be large — avoid mid-object cutoff. */
const IMPORT_MAX_TOKENS = 16_384

async function callImportModel(input: {
  system: string
  userText: string
}): Promise<unknown> {
  requireOpenRouterKey()
  const openRouter = getOpenRouter()
  const userText =
    input.userText.length > IMPORT_TEXT_MAX_CHARS
      ? `${input.userText.slice(0, IMPORT_TEXT_MAX_CHARS)}\n\n[...truncated...]`
      : input.userText

  let result: Awaited<ReturnType<typeof openRouter.chat.send>>
  try {
    result = await openRouter.chat.send({
      chatRequest: {
        model: env.OPENROUTER_IMPORT_MODEL,
        temperature: 0.1,
        stream: false,
        maxTokens: IMPORT_MAX_TOKENS,
        responseFormat: { type: "json_object" },
        plugins: [{ id: "response-healing", enabled: true }],
        messages: [
          { role: "system", content: input.system },
          {
            role: "user",
            content: `Source document text:\n\n---\n${userText}\n---\n\nConvert to the required JSON object.`,
          },
        ],
      },
    })
  } catch (error) {
    logger.error({ err: error }, "document_import_openrouter_failed")
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "AI import service failed. Try again later.",
    })
  }

  // SDK returns ChatResult when stream:false
  const chat = result as {
    choices?: Array<{
      finishReason?: string | null
      message?: { content?: string | null | Array<unknown> }
    }>
  }
  const choice = chat.choices?.[0]
  const content = choice?.message?.content
  const raw =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((part) =>
              part && typeof part === "object" && "text" in part
                ? String((part as { text?: string }).text ?? "")
                : ""
            )
            .join("")
        : ""

  if (!raw.trim()) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "AI returned an empty response.",
    })
  }

  try {
    return parseModelJson(raw)
  } catch (error) {
    logger.warn(
      {
        preview: raw.slice(0, 400),
        tail: raw.slice(-200),
        length: raw.length,
        finishReason: choice?.finishReason ?? null,
        parseError: error instanceof Error ? error.message : String(error),
      },
      "document_import_json_parse_failed"
    )
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message:
        choice?.finishReason === "length"
          ? "AI response was truncated. Try a shorter PDF or another model."
          : "AI returned invalid JSON. Try a cleaner PDF.",
    })
  }
}

export async function importResumeFromPdf(input: {
  filename: string
  pdfBase64: string
}): Promise<ResumeImportResult> {
  const bytes = decodePdfBase64(input.pdfBase64)
  let text: string
  try {
    text = await extractPdfText(bytes)
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Failed to read PDF text.",
    })
  }

  const parsed = coerceResumeDocument(
    ensureIdsDeep(await callImportModel({ system: RESUME_SYSTEM, userText: text }))
  )
  const result = resumeImportResultSchema.safeParse(parsed)
  if (!result.success) {
    logger.warn({ issues: result.error.issues.slice(0, 8) }, "document_import_resume_validate_failed")
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Could not map this PDF into a resume. Try another file.",
    })
  }

  const title =
    result.data.title.trim() ||
    defaultTitleFromFilename(input.filename, "Imported resume")

  return {
    ...result.data,
    title,
    document: result.data.document as ResumeDocumentDto,
  }
}

export async function importCoverLetterFromPdf(input: {
  filename: string
  pdfBase64: string
}): Promise<CoverLetterImportResult> {
  const bytes = decodePdfBase64(input.pdfBase64)
  let text: string
  try {
    text = await extractPdfText(bytes)
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Failed to read PDF text.",
    })
  }

  const parsed = coerceCoverLetterDocument(
    ensureIdsDeep(await callImportModel({ system: COVER_LETTER_SYSTEM, userText: text }))
  )
  const result = coverLetterImportResultSchema.safeParse(parsed)
  if (!result.success) {
    logger.warn(
      { issues: result.error.issues.slice(0, 8) },
      "document_import_cover_letter_validate_failed"
    )
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Could not map this PDF into a cover letter. Try another file.",
    })
  }

  const title =
    result.data.title.trim() ||
    defaultTitleFromFilename(input.filename, "Imported cover letter")

  return {
    ...result.data,
    title,
    document: result.data.document as CoverLetterDocumentDto,
  }
}
