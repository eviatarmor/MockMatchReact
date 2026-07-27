import type { ToolUIPart } from "ai"

export const REPLACE_DOCUMENT_TEXT_TOOL = "replace_document_text" as const

export type ReplaceDocumentTextInput = {
  find: string
  replacement: string
  targetId?: string
  locationLabel?: string
}

export type ReplaceDocumentTextOutput = {
  success: boolean
  message: string
  find: string
  replacement: string
  targetId?: string
  locationLabel?: string
}

export type ReplaceDocumentTextToolUIPart = ToolUIPart<{
  replace_document_text: {
    input: ReplaceDocumentTextInput
    output: ReplaceDocumentTextOutput
  }
}>

export function isReplaceDocumentTextPart(
  part: { type: string }
): part is ReplaceDocumentTextToolUIPart {
  return part.type === `tool-${REPLACE_DOCUMENT_TEXT_TOOL}`
}
