import {
  Code2,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  ListChecks,
  MessageSquare,
  Monitor,
  PenTool,
  Terminal,
  type LucideIcon,
} from "lucide-react"
import type {
  CreateCustomFormState,
  McqVariant,
  QuestionDomain,
  QuestionDifficulty,
  QuestionFormat,
} from "./types"

export const DEFAULT_FORMAT: QuestionFormat = "mcq"

export const CODE_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "cpp",
] as const

export const MCQ_VARIANTS: readonly McqVariant[] = ["single", "multi", "order"]

export const CONVERSATION_TRACKS = [
  "behavioral-core",
  "product-sense",
  "system-design-talk",
] as const

export const DOMAINS: readonly QuestionDomain[] = [
  "coding",
  "systemDesign",
  "dataScience",
  "ml",
  "security",
  "devops",
  "product",
  "design",
  "caseStudy",
  "consulting",
  "behavioral",
  "finance",
  "marketing",
  "sales",
  "clinical",
]

export const DIFFICULTIES: readonly QuestionDifficulty[] = [
  "easy",
  "medium",
  "hard",
]

/** Map bank format enum → simulations.format.* i18n key (camelCase). */
export function formatLabelKey(format: QuestionFormat): string {
  if (format === "code_run") return "codeRun"
  return format
}

export function formatIcon(format: QuestionFormat): LucideIcon {
  switch (format) {
    case "mcq":
      return ListChecks
    case "code_run":
      return Code2
    case "workspace":
      return Monitor
    case "terminal":
      return Terminal
    case "whiteboard":
      return PenTool
    case "spreadsheet":
      return FileSpreadsheet
    case "page":
      return FileText
    case "conversation":
      return MessageSquare
    default:
      return LayoutGrid
  }
}

export function defaultFormState(
  format: QuestionFormat = DEFAULT_FORMAT
): CreateCustomFormState {
  return {
    title: "",
    domain: "coding",
    difficulty: "medium",
    format,
    prompt: "",
    language: "javascript",
    company: "",
    mcqVariant: "single",
    options: ["", "", "", ""],
    correctIndex: 0,
    correctIndices: [0],
    trackHint: "auto",
    starterCode: "",
  }
}

/** Build format-specific payload for `questions.createCustom`. */
export function buildCreatePayload(
  state: CreateCustomFormState
): Record<string, unknown> {
  const prompt = state.prompt.trim()

  switch (state.format) {
    case "mcq": {
      const options = state.options.map((o) => o.trim()).filter(Boolean)
      const payload: Record<string, unknown> = {
        stem: prompt,
        options,
        variant: state.mcqVariant,
      }
      if (state.mcqVariant === "multi") {
        payload.correctIndices =
          state.correctIndices.length > 0
            ? state.correctIndices
            : [state.correctIndex]
      } else if (state.mcqVariant === "order") {
        payload.correctOrder = options.map((_, i) => i)
      } else {
        payload.correctIndex = state.correctIndex
      }
      return payload
    }
    case "conversation":
      return {
        interviewerPrompt: prompt,
        ...(state.trackHint && state.trackHint !== "auto"
          ? { trackHint: state.trackHint }
          : {}),
      }
    case "code_run":
    case "terminal":
      return {
        prompt,
        ...(state.starterCode.trim()
          ? { starterCode: state.starterCode }
          : {}),
      }
    case "workspace":
      return {
        prompt,
        ...(state.starterCode.trim()
          ? {
              files: {
                [state.language.includes("py")
                  ? "main.py"
                  : state.language.includes("ts")
                    ? "main.ts"
                    : "main.js"]: state.starterCode,
              },
            }
          : {}),
      }
    case "whiteboard":
    case "spreadsheet":
    case "page":
      return { prompt }
    default:
      return { prompt }
  }
}

export function canSubmitCreate(state: CreateCustomFormState): boolean {
  if (!state.title.trim() || !state.prompt.trim()) return false
  if (state.format === "mcq") {
    const options = state.options.map((o) => o.trim()).filter(Boolean)
    if (options.length < 2) return false
    if (state.mcqVariant === "single") {
      return (
        state.correctIndex >= 0 && state.correctIndex < options.length
      )
    }
    if (state.mcqVariant === "multi") {
      return state.correctIndices.some(
        (i) => i >= 0 && i < options.length
      )
    }
  }
  return true
}
