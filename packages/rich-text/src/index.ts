/**
 * Product-agnostic Lexical rich-text input.
 * Host supplies labels, value/onChange, and optional collab caret transport.
 */

export { RichTextInput, type RichTextInputProps } from "./rich-text-input"
export { RICH_TEXT_NODES } from "./nodes"
export { richTextTheme } from "./theme"
export { isBlankHtml } from "./lib/blank-html"
export {
  normalizeLinkUrl,
  applyBlockType,
  applyTextColor,
  applyHighlight,
  clearSelectionTextFormats,
  readActiveFormats,
  getSelectedLinkUrl,
  type ActiveFormats,
} from "./lib/formats"
export { measureCaretInRoot } from "./lib/caret-geometry"
export {
  DEFAULT_TEXT_COLORS,
  DEFAULT_HIGHLIGHT_COLORS,
  EXTERNAL_HTML_TAG,
} from "./constants"
export { DEFAULT_RICH_TEXT_LABELS } from "./default-labels"
export type {
  RichTextLabels,
  RichTextVariant,
  RichTextBlockType,
  RichTextCaretSnapshot,
  RichTextRemoteCaret,
  RichTextCollabCarets,
} from "./types"
