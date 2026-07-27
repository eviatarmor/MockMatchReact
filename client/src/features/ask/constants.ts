/** Suggestion ids map to i18n keys under `ask.suggestions.<id>`. */
export const ASK_SUGGESTION_IDS = [
  "resumeScore",
  "trackApplications",
  "discoverFit",
  "mockInterview",
  "credits",
  "exportPdf",
  "importResume",
  "coverLetter",
  "templates",
  "collabShare",
  "billing",
  "readiness",
  "questionBank",
  "autofill",
] as const

export type AskSuggestionId = (typeof ASK_SUGGESTION_IDS)[number]

export const WELCOME_MESSAGE_ID = "ask-welcome"
