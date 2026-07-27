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
