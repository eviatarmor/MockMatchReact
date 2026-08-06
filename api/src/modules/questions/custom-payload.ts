/**
 * Normalize + validate client payloads for custom question create.
 * Pure helpers — unit-tested without DB.
 */
import { TRPCError } from "@trpc/server"
import type { QuestionFormat } from "@mockmatch/schemas"
import type {
  CodeRunQuestionPayload,
  ConversationQuestionPayload,
  McqQuestionPayload,
  PageQuestionPayload,
  QuestionPayload,
  SpreadsheetQuestionPayload,
  WhiteboardQuestionPayload,
  WorkspaceQuestionPayload,
} from "../../db/schema/questions.js"
import { filterMcqIndices, normalizeMcqOptions } from "./mcq-options.js"
import {
  normalizePagePayload,
  normalizeSpreadsheetPayload,
} from "./payloads.js"

const SAFE_TRACK_HINTS = new Set([
  "behavioral-core",
  "product-sense",
  "system-design-talk",
])

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function requireNonEmptyString(
  value: unknown,
  field: string,
  max = 8000
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${field} is required`,
    })
  }
  return value.trim().slice(0, max)
}

function optionalString(value: unknown, max = 4000): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined
  return value.trim().slice(0, max)
}

function clampDuration(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined
  }
  return Math.min(180, Math.max(1, Math.floor(value)))
}

function safeTrackHint(
  domain: string,
  hint?: string | null
): "behavioral-core" | "product-sense" | "system-design-talk" {
  if (hint && SAFE_TRACK_HINTS.has(hint)) {
    return hint as "behavioral-core" | "product-sense" | "system-design-talk"
  }
  if (domain === "product") return "product-sense"
  if (domain === "systemDesign") return "system-design-talk"
  return "behavioral-core"
}

/** Prefer payload field, else body fallback; throw if both empty. */
function requirePromptOrBody(
  raw: Record<string, unknown>,
  body: string,
  field: string,
  message: string
): string {
  const fromRaw =
    typeof raw[field] === "string" && (raw[field] as string).trim()
      ? (raw[field] as string).trim().slice(0, 8000)
      : ""
  const prompt = fromRaw || body
  if (!prompt) {
    throw new TRPCError({ code: "BAD_REQUEST", message })
  }
  return prompt
}

function parseMcqVariant(
  raw: Record<string, unknown>
): NonNullable<McqQuestionPayload["variant"]> {
  if (
    raw.variant === "multi" ||
    raw.variant === "order" ||
    raw.variant === "single"
  ) {
    return raw.variant
  }
  if (Array.isArray(raw.correctOrder)) return "order"
  if (Array.isArray(raw.correctIndices)) return "multi"
  return "single"
}

function parseMultiCorrectIndices(
  raw: Record<string, unknown>,
  optionCount: number
): number[] {
  let correctIndices = filterMcqIndices(raw.correctIndices, optionCount)
  if (correctIndices.length > 0) {
    return [...new Set(correctIndices)].sort((a, b) => a - b)
  }
  if (
    typeof raw.correctIndex === "number" &&
    Number.isInteger(raw.correctIndex) &&
    raw.correctIndex >= 0 &&
    raw.correctIndex < optionCount
  ) {
    return [raw.correctIndex]
  }
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "MCQ multi requires correctIndices",
  })
}

function parseOrderIndices(
  raw: Record<string, unknown>,
  optionCount: number
): number[] {
  let correctOrder = filterMcqIndices(raw.correctOrder, optionCount)
  if (correctOrder.length !== optionCount) {
    correctOrder = Array.from({ length: optionCount }, (_, i) => i)
  }
  const sorted = [...correctOrder].sort((a, b) => a - b)
  if (!sorted.every((v, i) => v === i)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MCQ correctOrder must be a permutation of option indices",
    })
  }
  return correctOrder
}

function parseSingleCorrectIndex(
  raw: Record<string, unknown>,
  optionCount: number
): number {
  const correctIndex =
    typeof raw.correctIndex === "number" && Number.isInteger(raw.correctIndex)
      ? raw.correctIndex
      : -1
  if (correctIndex < 0 || correctIndex >= optionCount) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MCQ single requires a valid correctIndex",
    })
  }
  return correctIndex
}

function withExplanation<T extends Record<string, unknown>>(
  base: T,
  explanation: string | undefined
): T {
  return explanation ? { ...base, explanation } : base
}

function normalizeMcq(
  raw: Record<string, unknown>,
  body: string
): McqQuestionPayload {
  const options = normalizeMcqOptions(raw.options)
  if (options.length < 2) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MCQ requires at least 2 options",
    })
  }

  const stem =
    typeof raw.stem === "string" && raw.stem.trim()
      ? raw.stem.trim().slice(0, 4000)
      : body
  if (!stem) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MCQ requires a stem (or body)",
    })
  }

  const variant = parseMcqVariant(raw)
  const explanation = optionalString(raw.explanation, 4000)

  if (variant === "multi") {
    return withExplanation(
      {
        stem,
        options,
        variant: "multi" as const,
        correctIndices: parseMultiCorrectIndices(raw, options.length),
      },
      explanation
    )
  }

  if (variant === "order") {
    return withExplanation(
      {
        stem,
        options,
        variant: "order" as const,
        correctOrder: parseOrderIndices(raw, options.length),
      },
      explanation
    )
  }

  return withExplanation(
    {
      stem,
      options,
      variant: "single" as const,
      correctIndex: parseSingleCorrectIndex(raw, options.length),
    },
    explanation
  )
}

function normalizeConversation(
  raw: Record<string, unknown>,
  body: string,
  domain: string
): ConversationQuestionPayload {
  const interviewerPrompt = requirePromptOrBody(
    raw,
    body,
    "interviewerPrompt",
    "Conversation requires interviewerPrompt or body"
  )
  const followUps = Array.isArray(raw.followUps)
    ? raw.followUps
        .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
        .map((f) => f.trim().slice(0, 500))
        .slice(0, 8)
    : []
  const rubric = optionalString(raw.rubric, 4000)
  const trackHint = safeTrackHint(
    domain,
    typeof raw.trackHint === "string" ? raw.trackHint : null
  )
  return {
    interviewerPrompt,
    followUps,
    trackHint,
    ...(rubric ? { rubric } : {}),
  }
}

function sanitizeFilesMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter(
        ([path, content]) =>
          typeof path === "string" &&
          path.trim() &&
          !path.includes("..") &&
          typeof content === "string"
      )
      .map(([path, content]) => [
        path.replace(/\\/g, "/").replace(/^\/+/, "").slice(0, 200),
        (content as string).slice(0, 100_000),
      ])
      .filter(([path]) => path.length > 0)
      .slice(0, 40)
  )
}

function defaultEntryPath(lang: string): string {
  if (lang.includes("py")) return "main.py"
  if (lang.includes("ts")) return "main.ts"
  if (lang.includes("cpp")) return "main.cpp"
  return "main.js"
}

function defaultStarterCode(lang: string): string {
  if (lang.includes("py")) {
    return `# TODO: implement\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n`
  }
  return `// TODO: implement\n\nfunction solve() {\n  // …\n}\n\nsolve()\n`
}

function parseCodeTests(
  raw: unknown
): NonNullable<CodeRunQuestionPayload["tests"]> {
  if (!Array.isArray(raw)) return []
  return raw
    .map((t) => asRecord(t))
    .filter((t) => typeof t.name === "string" && t.name.trim())
    .map((t) => ({
      name: String(t.name).trim().slice(0, 120),
      ...(typeof t.stdin === "string" ? { stdin: t.stdin.slice(0, 10_000) } : {}),
      ...(typeof t.expectedStdout === "string"
        ? { expectedStdout: t.expectedStdout.slice(0, 10_000) }
        : {}),
    }))
    .slice(0, 20)
}

function resolveCodeLanguage(
  raw: Record<string, unknown>,
  language: string | null | undefined
): string {
  if (typeof raw.language === "string" && raw.language.trim()) {
    return raw.language.trim()
  }
  return language || "javascript"
}

function resolveCodeFiles(
  raw: Record<string, unknown>,
  lang: string,
  starterCode: string | undefined
): { files: Record<string, string>; entryPath: string } {
  const entryPath =
    typeof raw.entryPath === "string" && raw.entryPath.trim()
      ? raw.entryPath.trim().replace(/\\/g, "/").replace(/^\/+/, "").slice(0, 200)
      : defaultEntryPath(lang)

  let files = sanitizeFilesMap(raw.files)
  if (Object.keys(files).length === 0) {
    files = { [entryPath]: starterCode ?? defaultStarterCode(lang) }
  }
  return { files, entryPath }
}

function normalizeCodeLike(
  format: "code_run" | "workspace" | "terminal",
  raw: Record<string, unknown>,
  body: string,
  language: string | null | undefined
): CodeRunQuestionPayload | WorkspaceQuestionPayload {
  const prompt = requirePromptOrBody(
    raw,
    body,
    "prompt",
    `${format} requires prompt or body`
  )
  const lang = resolveCodeLanguage(raw, language)
  const durationMin = clampDuration(raw.durationMin)
  const starterCode = optionalString(raw.starterCode, 100_000)
  const { files, entryPath } = resolveCodeFiles(raw, lang, starterCode)

  if (format === "workspace") {
    return {
      prompt,
      files,
      ...(durationMin !== undefined ? { durationMin } : {}),
    } satisfies WorkspaceQuestionPayload
  }

  return {
    prompt,
    language: lang,
    starterCode: starterCode ?? files[entryPath],
    files,
    entryPath,
    tests: parseCodeTests(raw.tests),
    ...(durationMin !== undefined ? { durationMin } : {}),
  } satisfies CodeRunQuestionPayload
}

function parseStarterBoard(
  raw: Record<string, unknown>
): WhiteboardQuestionPayload["starterBoard"] | undefined {
  const sb = asRecord(raw.starterBoard)
  if (sb.version === 1 && sb.elements && typeof sb.elements === "object") {
    return {
      version: 1,
      elements: sb.elements as Record<string, unknown>,
    }
  }
  return undefined
}

function normalizeWhiteboard(
  raw: Record<string, unknown>,
  body: string
): WhiteboardQuestionPayload {
  const prompt = requirePromptOrBody(
    raw,
    body,
    "prompt",
    "Whiteboard requires prompt or body"
  )
  const durationMin = clampDuration(raw.durationMin)
  const rubric = optionalString(raw.rubric, 4000)
  const defaultTemplateId = optionalString(raw.defaultTemplateId, 64)
  const starterBoard = parseStarterBoard(raw)
  return {
    prompt,
    ...(durationMin !== undefined ? { durationMin } : {}),
    ...(rubric ? { rubric } : {}),
    ...(defaultTemplateId ? { defaultTemplateId } : {}),
    ...(starterBoard ? { starterBoard } : {}),
  }
}

export type NormalizedCustom = {
  payload: QuestionPayload
  body: string
  language: string | null
  contentCache: Record<string, string>
}

function bodyOr(fallback: string, primary: string): string {
  return fallback || primary
}

function normalizeConversationBranch(
  raw: Record<string, unknown>,
  bodyFallback: string,
  domain: string
): NormalizedCustom {
  const payload = normalizeConversation(raw, bodyFallback, domain)
  return {
    payload,
    body: bodyOr(bodyFallback, payload.interviewerPrompt),
    language: null,
    contentCache: {},
  }
}

function normalizeMcqBranch(
  raw: Record<string, unknown>,
  bodyFallback: string
): NormalizedCustom {
  const payload = normalizeMcq(raw, bodyFallback)
  return {
    payload,
    body: bodyOr(bodyFallback, payload.stem),
    language: null,
    contentCache: {},
  }
}

function normalizeSpreadsheetBranch(
  raw: Record<string, unknown>,
  bodyFallback: string,
  domain: string
): NormalizedCustom {
  const payload = normalizeSpreadsheetPayload({
    title: "",
    body:
      bodyFallback ||
      requireNonEmptyString(raw.prompt ?? bodyFallback, "prompt"),
    domain,
    difficulty: "medium",
    format: "spreadsheet",
    payload: raw,
  }) as SpreadsheetQuestionPayload
  if (!payload.prompt?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Spreadsheet requires prompt or body",
    })
  }
  return {
    payload,
    body: bodyOr(bodyFallback, payload.prompt),
    language: null,
    contentCache: {},
  }
}

function normalizePageBranch(
  raw: Record<string, unknown>,
  bodyFallback: string,
  domain: string
): NormalizedCustom {
  const payload = normalizePagePayload({
    title: "",
    body:
      bodyFallback ||
      requireNonEmptyString(raw.prompt ?? bodyFallback, "prompt"),
    domain,
    difficulty: "medium",
    format: "page",
    payload: raw,
  }) as PageQuestionPayload
  if (!payload.prompt?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Document analysis requires prompt or body",
    })
  }
  return {
    payload,
    body: bodyOr(bodyFallback, payload.prompt),
    language: null,
    contentCache: {},
  }
}

function normalizeWhiteboardBranch(
  raw: Record<string, unknown>,
  bodyFallback: string
): NormalizedCustom {
  const payload = normalizeWhiteboard(raw, bodyFallback)
  return {
    payload,
    body: bodyOr(bodyFallback, payload.prompt),
    language: null,
    contentCache: {},
  }
}

function normalizeCodeBranch(
  format: "code_run" | "workspace" | "terminal",
  raw: Record<string, unknown>,
  bodyFallback: string,
  language: string | null | undefined
): NormalizedCustom {
  const payload = normalizeCodeLike(format, raw, bodyFallback, language)
  const files =
    "files" in payload && payload.files ? payload.files : {}
  const resolvedLang =
    "language" in payload && typeof payload.language === "string"
      ? payload.language
      : language ?? "javascript"
  return {
    payload,
    body: bodyOr(bodyFallback, payload.prompt),
    language: resolvedLang,
    contentCache: { ...files },
  }
}

/**
 * Validate + normalize a custom-question create/update payload for any format.
 */
export function normalizeCustomQuestionPayload(input: {
  format: QuestionFormat
  domain: string
  body?: string | null
  language?: string | null
  payload?: Record<string, unknown> | null
}): NormalizedCustom {
  const raw = asRecord(input.payload)
  const bodyFallback =
    typeof input.body === "string" && input.body.trim()
      ? input.body.trim().slice(0, 8000)
      : ""

  switch (input.format) {
    case "conversation":
      return normalizeConversationBranch(raw, bodyFallback, input.domain)
    case "mcq":
      return normalizeMcqBranch(raw, bodyFallback)
    case "spreadsheet":
      return normalizeSpreadsheetBranch(raw, bodyFallback, input.domain)
    case "page":
      return normalizePageBranch(raw, bodyFallback, input.domain)
    case "whiteboard":
      return normalizeWhiteboardBranch(raw, bodyFallback)
    case "code_run":
    case "workspace":
    case "terminal":
      return normalizeCodeBranch(
        input.format,
        raw,
        bodyFallback,
        input.language
      )
    default: {
      const _exhaustive: never = input.format
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unsupported format: ${_exhaustive}`,
      })
    }
  }
}

/** Simulation type catalog for create UI / sidebar handoff. */
export const SIMULATION_TYPES: Array<{
  format: QuestionFormat
  id: string
  createSupported: boolean
  notes: string | null
}> = [
  {
    format: "mcq",
    id: "mcq",
    createSupported: true,
    notes: "Single / multi / order variants via payload.variant",
  },
  {
    format: "code_run",
    id: "code_run",
    createSupported: true,
    notes: "Single-file IDE practice; optional tests[]",
  },
  {
    format: "workspace",
    id: "workspace",
    createSupported: true,
    notes: "Multi-file IDE; payload.files map",
  },
  {
    format: "terminal",
    id: "terminal",
    createSupported: true,
    notes: "Terminal-oriented code_run-like payload",
  },
  {
    format: "whiteboard",
    id: "whiteboard",
    createSupported: true,
    notes: "Prompt + optional starterBoard",
  },
  {
    format: "spreadsheet",
    id: "spreadsheet",
    createSupported: true,
    notes: "Prompt + optional starterWorkbook",
  },
  {
    format: "page",
    id: "page",
    createSupported: true,
    notes: "Document analysis; optional starterHtml",
  },
  {
    format: "conversation",
    id: "conversation",
    createSupported: true,
    notes: "Voice track; trackHint limited to catalog tracks",
  },
]
