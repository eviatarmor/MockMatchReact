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

function normalizeMcq(
  raw: Record<string, unknown>,
  body: string
): McqQuestionPayload {
  const options = Array.isArray(raw.options)
    ? raw.options
        .map((o) => (typeof o === "string" ? o.trim() : String(o ?? "").trim()))
        .filter((o) => o.length > 0)
        .slice(0, 6)
    : []
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

  let variant: McqQuestionPayload["variant"] =
    raw.variant === "multi" || raw.variant === "order" || raw.variant === "single"
      ? raw.variant
      : undefined
  if (!variant) {
    if (Array.isArray(raw.correctOrder)) variant = "order"
    else if (Array.isArray(raw.correctIndices)) variant = "multi"
    else variant = "single"
  }

  const explanation = optionalString(raw.explanation, 4000)

  if (variant === "multi") {
    let correctIndices = Array.isArray(raw.correctIndices)
      ? raw.correctIndices
          .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
          .filter((n) => n >= 0 && n < options.length)
      : []
    if (correctIndices.length === 0) {
      if (
        typeof raw.correctIndex === "number" &&
        Number.isInteger(raw.correctIndex) &&
        raw.correctIndex >= 0 &&
        raw.correctIndex < options.length
      ) {
        correctIndices = [raw.correctIndex]
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "MCQ multi requires correctIndices",
        })
      }
    }
    correctIndices = [...new Set(correctIndices)].sort((a, b) => a - b)
    return {
      stem,
      options,
      variant: "multi",
      correctIndices,
      ...(explanation ? { explanation } : {}),
    }
  }

  if (variant === "order") {
    let correctOrder = Array.isArray(raw.correctOrder)
      ? raw.correctOrder
          .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
          .filter((n) => n >= 0 && n < options.length)
      : []
    if (correctOrder.length !== options.length) {
      correctOrder = options.map((_, i) => i)
    }
    const sorted = [...correctOrder].sort((a, b) => a - b)
    if (!sorted.every((v, i) => v === i)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "MCQ correctOrder must be a permutation of option indices",
      })
    }
    return {
      stem,
      options,
      variant: "order",
      correctOrder,
      ...(explanation ? { explanation } : {}),
    }
  }

  const correctIndex =
    typeof raw.correctIndex === "number" && Number.isInteger(raw.correctIndex)
      ? raw.correctIndex
      : -1
  if (correctIndex < 0 || correctIndex >= options.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MCQ single requires a valid correctIndex",
    })
  }
  return {
    stem,
    options,
    variant: "single",
    correctIndex,
    ...(explanation ? { explanation } : {}),
  }
}

function normalizeConversation(
  raw: Record<string, unknown>,
  body: string,
  domain: string
): ConversationQuestionPayload {
  const interviewerPrompt =
    typeof raw.interviewerPrompt === "string" && raw.interviewerPrompt.trim()
      ? raw.interviewerPrompt.trim().slice(0, 8000)
      : body
  if (!interviewerPrompt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Conversation requires interviewerPrompt or body",
    })
  }
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

function normalizeCodeLike(
  format: "code_run" | "workspace" | "terminal",
  raw: Record<string, unknown>,
  body: string,
  language: string | null | undefined
): CodeRunQuestionPayload | WorkspaceQuestionPayload {
  const prompt =
    typeof raw.prompt === "string" && raw.prompt.trim()
      ? raw.prompt.trim().slice(0, 8000)
      : body
  if (!prompt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${format} requires prompt or body`,
    })
  }
  const lang =
    (typeof raw.language === "string" && raw.language.trim()
      ? raw.language.trim()
      : language) || "javascript"
  const durationMin = clampDuration(raw.durationMin)

  const filesFromPayload =
    raw.files && typeof raw.files === "object" && !Array.isArray(raw.files)
      ? Object.fromEntries(
          Object.entries(raw.files as Record<string, unknown>)
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
      : {}

  const starterCode = optionalString(raw.starterCode, 100_000)
  const entryPath =
    typeof raw.entryPath === "string" && raw.entryPath.trim()
      ? raw.entryPath.trim().replace(/\\/g, "/").replace(/^\/+/, "").slice(0, 200)
      : lang.includes("py")
        ? "main.py"
        : lang.includes("ts")
          ? "main.ts"
          : lang.includes("cpp")
            ? "main.cpp"
            : "main.js"

  let files = filesFromPayload
  if (Object.keys(files).length === 0) {
    const code =
      starterCode ??
      (lang.includes("py")
        ? `# TODO: implement\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n`
        : `// TODO: implement\n\nfunction solve() {\n  // …\n}\n\nsolve()\n`)
    files = { [entryPath]: code }
  }

  if (format === "workspace") {
    return {
      prompt,
      files,
      ...(durationMin !== undefined ? { durationMin } : {}),
    } satisfies WorkspaceQuestionPayload
  }

  const tests = Array.isArray(raw.tests)
    ? raw.tests
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
    : []

  return {
    prompt,
    language: lang,
    starterCode: starterCode ?? files[entryPath],
    files,
    entryPath,
    tests,
    ...(durationMin !== undefined ? { durationMin } : {}),
  } satisfies CodeRunQuestionPayload
}

function normalizeWhiteboard(
  raw: Record<string, unknown>,
  body: string
): WhiteboardQuestionPayload {
  const prompt =
    typeof raw.prompt === "string" && raw.prompt.trim()
      ? raw.prompt.trim().slice(0, 8000)
      : body
  if (!prompt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Whiteboard requires prompt or body",
    })
  }
  const durationMin = clampDuration(raw.durationMin)
  const rubric = optionalString(raw.rubric, 4000)
  const defaultTemplateId = optionalString(raw.defaultTemplateId, 64)
  let starterBoard: WhiteboardQuestionPayload["starterBoard"] | undefined
  const sb = asRecord(raw.starterBoard)
  if (sb.version === 1 && sb.elements && typeof sb.elements === "object") {
    starterBoard = {
      version: 1,
      elements: sb.elements as Record<string, unknown>,
    }
  }
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
    case "conversation": {
      const payload = normalizeConversation(raw, bodyFallback, input.domain)
      return {
        payload,
        body: bodyFallback || payload.interviewerPrompt,
        language: null,
        contentCache: {},
      }
    }
    case "mcq": {
      const payload = normalizeMcq(raw, bodyFallback)
      return {
        payload,
        body: bodyFallback || payload.stem,
        language: null,
        contentCache: {},
      }
    }
    case "spreadsheet": {
      const payload = normalizeSpreadsheetPayload({
        title: "",
        body: bodyFallback || requireNonEmptyString(raw.prompt ?? bodyFallback, "prompt"),
        domain: input.domain,
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
        body: bodyFallback || payload.prompt,
        language: null,
        contentCache: {},
      }
    }
    case "page": {
      const payload = normalizePagePayload({
        title: "",
        body: bodyFallback || requireNonEmptyString(raw.prompt ?? bodyFallback, "prompt"),
        domain: input.domain,
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
        body: bodyFallback || payload.prompt,
        language: null,
        contentCache: {},
      }
    }
    case "whiteboard": {
      const payload = normalizeWhiteboard(raw, bodyFallback)
      return {
        payload,
        body: bodyFallback || payload.prompt,
        language: null,
        contentCache: {},
      }
    }
    case "code_run":
    case "workspace":
    case "terminal": {
      const payload = normalizeCodeLike(
        input.format,
        raw,
        bodyFallback,
        input.language
      )
      const files =
        "files" in payload && payload.files
          ? payload.files
          : {}
      const language =
        "language" in payload && typeof payload.language === "string"
          ? payload.language
          : input.language ?? "javascript"
      return {
        payload,
        body: bodyFallback || payload.prompt,
        language,
        contentCache: { ...files },
      }
    }
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
