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

export {
  buildCreatePayload,
  buildCreateInputFields,
  canSubmitCreate,
  isCodeLikeFormat,
} from "./lib/build-create-payload"

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

const FORMAT_ICONS: Record<QuestionFormat, LucideIcon> = {
  mcq: ListChecks,
  code_run: Code2,
  workspace: Monitor,
  terminal: Terminal,
  whiteboard: PenTool,
  spreadsheet: FileSpreadsheet,
  page: FileText,
  conversation: MessageSquare,
}

export function formatIcon(format: QuestionFormat): LucideIcon {
  return FORMAT_ICONS[format] ?? LayoutGrid
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
