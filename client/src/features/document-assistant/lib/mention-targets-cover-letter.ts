import type {
  CoverLetterDocument,
  LetterBlock,
} from "@/features/cover-letter-editor/types"
import type { MentionTarget } from "../types"
import { stripHtml } from "./strip-html"

function push(parts: string[], value: string | null | undefined) {
  const t = value?.trim()
  if (t) parts.push(t)
}

function blockContext(block: LetterBlock): string {
  const parts: string[] = []
  switch (block.type) {
    case "greeting":
    case "paragraph":
    case "subject":
      push(parts, stripHtml(block.text))
      break
    case "signoff":
      push(parts, stripHtml(block.closing))
      push(parts, block.signature)
      break
    case "custom":
      push(parts, block.heading)
      push(parts, stripHtml(block.text))
      break
  }
  return parts.join("\n")
}

function blockLabel(
  block: LetterBlock,
  labelForType: (type: LetterBlock["type"]) => string
): string {
  if (block.type === "custom" && block.heading.trim()) return block.heading.trim()
  if (block.type === "signoff") {
    const closing = stripHtml(block.closing)
    return closing || labelForType(block.type)
  }
  const text = "text" in block ? stripHtml(block.text) : ""
  if (text) {
    const short = text.length > 40 ? `${text.slice(0, 40)}…` : text
    return `${labelForType(block.type)} · ${short}`
  }
  return labelForType(block.type)
}

export function buildCoverLetterMentionTargets(
  document: CoverLetterDocument,
  labels: {
    sender: string
    recipient: string
    labelForType: (type: LetterBlock["type"]) => string
  }
): MentionTarget[] {
  const targets: MentionTarget[] = []

  targets.push({
    id: "sender",
    label: labels.sender,
    kind: "sender",
    getContext: () => {
      const parts: string[] = []
      push(parts, document.sender.name)
      push(parts, document.sender.title)
      for (const c of document.sender.contacts) push(parts, c.value)
      return parts.join("\n")
    },
  })

  targets.push({
    id: "recipient",
    label: labels.recipient,
    kind: "recipient",
    getContext: () => {
      const parts: string[] = []
      push(parts, document.recipient.name)
      push(parts, document.recipient.title)
      push(parts, document.recipient.company)
      if (document.recipient.addressLines) {
        for (const line of document.recipient.addressLines) push(parts, line)
      }
      return parts.join("\n")
    },
  })

  for (const block of document.blocks) {
    targets.push({
      id: block.id,
      label: blockLabel(block, labels.labelForType),
      kind: `block:${block.type}`,
      getContext: () => blockContext(block),
    })
  }

  return targets
}
