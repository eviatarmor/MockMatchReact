/** Default text color swatches (product can override via props later). */
export const DEFAULT_TEXT_COLORS = [
  "#171717",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
] as const

/** Default highlight (background) swatches. First is "none". */
export const DEFAULT_HIGHLIGHT_COLORS = [
  "transparent",
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#fbcfe8",
  "#e9d5ff",
  "#fed7aa",
  "#fecaca",
] as const

/** Tag so OnChange ignores programmatic external HTML applies. */
export const EXTERNAL_HTML_TAG = "rich-text-external"
