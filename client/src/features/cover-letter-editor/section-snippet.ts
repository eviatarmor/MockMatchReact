import type { LetterBlock } from "./types"

/** Body fields hold Lexical HTML; strip tags down to plain text for preview lines. */
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent ?? ""
}

/** A short, plain-text preview line for a block (used in section lists). */
export function snippet(block: LetterBlock): string {
  if (block.type === "signoff") return stripHtml(block.closing)
  if (block.type === "custom") return block.heading
  return stripHtml(block.text)
}
