/** Suggestion ids map to i18n keys under `ai.suggestions.<id>`. */
export const DOCUMENT_AI_SUGGESTION_IDS = [
  "improveClarity",
  "addMetrics",
  "shorten",
  "strongerOpening",
  "fixGrammar",
  "tailorRole",
] as const

export type DocumentAiSuggestionId = (typeof DOCUMENT_AI_SUGGESTION_IDS)[number]

export const DOCUMENT_AI_WELCOME_ID = "document-ai-welcome"

/**
 * Streamdown / MessageResponse styles for assistant markdown.
 * All colors use theme tokens so light/dark stay consistent (no mixed Shiki chrome).
 */
export const DOCUMENT_AI_ASSISTANT_TEXT_CLASS = [
  "text-[15px] leading-relaxed text-foreground",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_p]:my-2 [&_p]:leading-relaxed [&_p]:text-muted-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-muted-foreground",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground",
  "[&_li]:leading-relaxed",
  "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline",
  // Tables
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-xs",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-foreground",
  "[&_td]:border [&_td]:border-border [&_td]:bg-background [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_td]:text-muted-foreground",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
  // Inline + fenced code — theme surfaces only (Shiki colors overridden in index.css)
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-foreground",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-2",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_hr]:my-3 [&_hr]:border-border",
].join(" ")
