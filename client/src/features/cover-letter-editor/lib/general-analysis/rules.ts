import { isBlankHtml } from "@/lib/blank-html"
import { stripHtml } from "../../section-snippet"
import type {
  CoverLetterDocument,
  GreetingBlock,
  LetterBlock,
  ParagraphBlock,
  SignoffBlock,
} from "../../types"
import type { AnalysisFinding, AnalysisRuleId, AnalysisSeverity } from "./types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_MIN_DIGITS = 7
/** Combined plain-text length of body paragraphs before we flag "too short". */
const BODY_MIN_CHARS = 120

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function finding(
  ruleId: AnalysisRuleId,
  severity: AnalysisSeverity,
  extra: Partial<AnalysisFinding> & { id?: string } = {}
): AnalysisFinding {
  const { id, messageKey, ...rest } = extra
  return {
    id: id ?? ruleId,
    ruleId,
    severity,
    messageKey: messageKey ?? ruleId,
    ...rest,
  }
}

function contactValue(
  doc: CoverLetterDocument,
  iconKey: "mail" | "phone" | "mapPin" | "globe" | "link"
): string {
  return doc.sender.contacts.find((c) => c.iconKey === iconKey)?.value?.trim() ?? ""
}

function allOfType<T extends LetterBlock["type"]>(
  blocks: readonly LetterBlock[],
  type: T
): Extract<LetterBlock, { type: T }>[] {
  return blocks.filter((b): b is Extract<LetterBlock, { type: T }> => b.type === type)
}

function firstBlockId(blocks: readonly LetterBlock[], type: LetterBlock["type"]): string | undefined {
  return blocks.find((b) => b.type === type)?.id
}

function checkSender(doc: CoverLetterDocument, out: AnalysisFinding[]) {
  if (!hasText(doc.sender.name)) {
    out.push(
      finding("missing_name", "critical", {
        locationKey: "sender",
        focusTarget: "sender:name",
      })
    )
  }

  const email = contactValue(doc, "mail")
  if (!email) {
    out.push(
      finding("missing_email", "high", {
        locationKey: "contact",
        focusTarget: "sender:contact:mail",
      })
    )
  } else if (!EMAIL_RE.test(email)) {
    out.push(
      finding("invalid_email", "high", {
        locationKey: "contact",
        focusTarget: "sender:contact:mail",
      })
    )
  }

  const phone = contactValue(doc, "phone")
  if (!phone) {
    out.push(
      finding("missing_phone", "high", {
        locationKey: "contact",
        focusTarget: "sender:contact:phone",
      })
    )
  } else {
    const digits = phone.replace(/\D/g, "")
    if (digits.length < PHONE_MIN_DIGITS) {
      out.push(
        finding("invalid_phone", "medium", {
          locationKey: "contact",
          focusTarget: "sender:contact:phone",
        })
      )
    }
  }

  if (!contactValue(doc, "mapPin")) {
    out.push(
      finding("missing_location", "medium", {
        locationKey: "contact",
        focusTarget: "sender:contact:mapPin",
      })
    )
  }

  if (!contactValue(doc, "link")) {
    out.push(
      finding("missing_linkedin", "low", {
        locationKey: "contact",
        focusTarget: "sender:contact:link",
      })
    )
  }
}

function checkMeta(doc: CoverLetterDocument, out: AnalysisFinding[]) {
  if (!hasText(doc.date)) {
    out.push(
      finding("missing_date", "medium", {
        locationKey: "date",
        focusTarget: "date",
      })
    )
  }

  if (!hasText(doc.recipient.company)) {
    out.push(
      finding("missing_company", "high", {
        locationKey: "recipient",
        focusTarget: "recipient:company",
      })
    )
  }
}

function checkGreeting(doc: CoverLetterDocument, out: AnalysisFinding[]) {
  const greetings = allOfType(doc.blocks, "greeting") as GreetingBlock[]
  const empty =
    greetings.length === 0 || greetings.every((g) => isBlankHtml(g.text))
  if (empty) {
    const sid = firstBlockId(doc.blocks, "greeting")
    out.push(
      finding("missing_greeting", "high", {
        locationKey: "greeting",
        blockId: sid,
        focusTarget: sid,
      })
    )
  }
}

function checkBody(doc: CoverLetterDocument, out: AnalysisFinding[]) {
  const paragraphs = allOfType(doc.blocks, "paragraph") as ParagraphBlock[]
  const customs = allOfType(doc.blocks, "custom")

  let totalChars = 0
  let firstBodyTarget: string | undefined

  for (const p of paragraphs) {
    const plain = stripHtml(p.text).trim()
    if (plain) {
      totalChars += plain.length
      if (!firstBodyTarget) firstBodyTarget = p.id
    }
  }
  for (const c of customs) {
    const plain = stripHtml(c.text).trim()
    if (plain) {
      totalChars += plain.length
      if (!firstBodyTarget) firstBodyTarget = c.id
    }
  }

  if (totalChars === 0) {
    const sid = firstBlockId(doc.blocks, "paragraph") ?? firstBlockId(doc.blocks, "custom")
    out.push(
      finding("missing_body", "critical", {
        locationKey: "body",
        blockId: sid,
        focusTarget: sid,
      })
    )
    return
  }

  if (totalChars < BODY_MIN_CHARS) {
    out.push(
      finding("body_too_short", "medium", {
        locationKey: "body",
        focusTarget: firstBodyTarget,
        messageParams: { min: BODY_MIN_CHARS },
      })
    )
  }
}

function checkSignoff(doc: CoverLetterDocument, out: AnalysisFinding[]) {
  const signoffs = allOfType(doc.blocks, "signoff") as SignoffBlock[]
  if (signoffs.length === 0) {
    out.push(
      finding("missing_signoff", "high", {
        locationKey: "signoff",
      })
    )
    return
  }

  const anyComplete = signoffs.some(
    (s) => !isBlankHtml(s.closing) && hasText(s.signature)
  )
  if (anyComplete) return

  const anyPartial = signoffs.some(
    (s) => !isBlankHtml(s.closing) || hasText(s.signature)
  )
  if (!anyPartial) {
    const sid = firstBlockId(doc.blocks, "signoff")
    out.push(
      finding("missing_signoff", "high", {
        locationKey: "signoff",
        blockId: sid,
        focusTarget: sid ? `block:${sid}:closing` : undefined,
      })
    )
    return
  }

  for (const s of signoffs) {
    const hasClosing = !isBlankHtml(s.closing)
    const hasSig = hasText(s.signature)
    if (hasClosing && hasSig) continue
    if (!hasClosing && !hasSig) continue
    out.push(
      finding("incomplete_signoff", "medium", {
        id: `incomplete_signoff:${s.id}`,
        locationKey: "signoff",
        blockId: s.id,
        focusTarget: !hasClosing ? `block:${s.id}:closing` : `block:${s.id}:signature`,
      })
    )
  }
}

/** Sync structural checks only (no Harper). */
export function analyzeStructure(doc: CoverLetterDocument): AnalysisFinding[] {
  const out: AnalysisFinding[] = []
  checkSender(doc, out)
  checkMeta(doc, out)
  checkGreeting(doc, out)
  checkBody(doc, out)
  checkSignoff(doc, out)
  return out
}
