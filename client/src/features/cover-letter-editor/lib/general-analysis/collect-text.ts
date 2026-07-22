import { stripHtml } from "../../section-snippet"
import type { CoverLetterDocument, LetterBlock } from "../../types"

function push(parts: string[], value: string | null | undefined) {
  const t = value?.trim()
  if (t) parts.push(t)
}

function blockPlain(block: LetterBlock, parts: string[]) {
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
}

/** Flatten letter prose for Harper lint (skip emails/phones/urls-ish contacts). */
export function collectPlainText(doc: CoverLetterDocument): string {
  const parts: string[] = []
  push(parts, doc.sender.name)
  push(parts, doc.sender.title)
  push(parts, doc.recipient.name)
  push(parts, doc.recipient.title)
  push(parts, doc.recipient.company)
  for (const block of doc.blocks) blockPlain(block, parts)
  return parts.join("\n")
}
