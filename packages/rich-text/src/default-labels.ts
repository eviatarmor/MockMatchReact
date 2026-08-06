import type { RichTextLabels } from "./types"

/** English demo/fallback labels. Product hosts should pass i18n strings. */
export const DEFAULT_RICH_TEXT_LABELS: RichTextLabels = {
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strikethrough: "Strikethrough",
  textColor: "Text color",
  highlight: "Highlight",
  link: "Link",
  linkApply: "Apply",
  linkPlaceholder: "https://…",
  linkRemove: "Remove link",
  heading: "Heading",
  paragraph: "Text",
  heading1: "Heading 1",
  heading2: "Heading 2",
  heading3: "Heading 3",
  bulletList: "Bullet list",
  orderedList: "Numbered list",
  clear: "Clear formatting",
  colorNone: "Default",
}
