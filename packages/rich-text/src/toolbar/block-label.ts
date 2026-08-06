import type { RichTextBlockType, RichTextLabels } from "../types"

const BLOCK_LABEL_KEY: Record<
  RichTextBlockType,
  keyof RichTextLabels
> = {
  paragraph: "paragraph",
  h1: "heading1",
  h2: "heading2",
  h3: "heading3",
  bullet: "bulletList",
  number: "orderedList",
}

export function blockTypeLabel(
  blockType: RichTextBlockType,
  labels: RichTextLabels
): string {
  const key = BLOCK_LABEL_KEY[blockType]
  return labels[key] ?? labels.paragraph
}
