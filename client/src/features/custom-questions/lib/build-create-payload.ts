import type {
  CreateCustomFormState,
  McqVariant,
  QuestionFormat,
} from "../types"

function trimOptions(options: readonly string[]): string[] {
  return options.map((o) => o.trim()).filter(Boolean)
}

function workspaceStarterFile(language: string): string {
  if (language.includes("py")) return "main.py"
  if (language.includes("ts")) return "main.ts"
  return "main.js"
}

function mcqCorrectFields(
  variant: McqVariant,
  options: readonly string[],
  correctIndex: number,
  correctIndices: readonly number[]
): Record<string, unknown> {
  if (variant === "multi") {
    return {
      correctIndices:
        correctIndices.length > 0 ? [...correctIndices] : [correctIndex],
    }
  }
  if (variant === "order") {
    return { correctOrder: options.map((_, i) => i) }
  }
  return { correctIndex }
}

function buildMcqPayload(state: CreateCustomFormState): Record<string, unknown> {
  const options = trimOptions(state.options)
  return {
    stem: state.prompt.trim(),
    options,
    variant: state.mcqVariant,
    ...mcqCorrectFields(
      state.mcqVariant,
      options,
      state.correctIndex,
      state.correctIndices
    ),
  }
}

function buildConversationPayload(
  state: CreateCustomFormState
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    interviewerPrompt: state.prompt.trim(),
  }
  if (state.trackHint && state.trackHint !== "auto") {
    base.trackHint = state.trackHint
  }
  return base
}

function buildCodeLikePayload(
  state: CreateCustomFormState
): Record<string, unknown> {
  const payload: Record<string, unknown> = { prompt: state.prompt.trim() }
  const starter = state.starterCode.trim()
  if (starter) payload.starterCode = state.starterCode
  return payload
}

function buildWorkspacePayload(
  state: CreateCustomFormState
): Record<string, unknown> {
  const payload: Record<string, unknown> = { prompt: state.prompt.trim() }
  const starter = state.starterCode.trim()
  if (!starter) return payload
  return {
    ...payload,
    files: { [workspaceStarterFile(state.language)]: state.starterCode },
  }
}

function buildPromptOnlyPayload(
  state: CreateCustomFormState
): Record<string, unknown> {
  return { prompt: state.prompt.trim() }
}

const FORMAT_PAYLOAD: Partial<
  Record<QuestionFormat, (state: CreateCustomFormState) => Record<string, unknown>>
> = {
  mcq: buildMcqPayload,
  conversation: buildConversationPayload,
  code_run: buildCodeLikePayload,
  terminal: buildCodeLikePayload,
  workspace: buildWorkspacePayload,
  whiteboard: buildPromptOnlyPayload,
  spreadsheet: buildPromptOnlyPayload,
  page: buildPromptOnlyPayload,
}

/** Build format-specific payload for `questions.createCustom`. */
export function buildCreatePayload(
  state: CreateCustomFormState
): Record<string, unknown> {
  const build = FORMAT_PAYLOAD[state.format] ?? buildPromptOnlyPayload
  return build(state)
}

export function isCodeLikeFormat(format: QuestionFormat): boolean {
  return (
    format === "code_run" || format === "workspace" || format === "terminal"
  )
}

/** tRPC createCustom input (minus payload) derived from form state. */
export function buildCreateInputFields(state: CreateCustomFormState) {
  return {
    title: state.title.trim(),
    domain: state.domain,
    difficulty: state.difficulty,
    format: state.format,
    body: state.prompt.trim(),
    language: isCodeLikeFormat(state.format) ? state.language : null,
    company: state.company.trim() || null,
  }
}

function canSubmitMcq(state: CreateCustomFormState): boolean {
  const options = trimOptions(state.options)
  if (options.length < 2) return false
  if (state.mcqVariant === "single") {
    return state.correctIndex >= 0 && state.correctIndex < options.length
  }
  if (state.mcqVariant === "multi") {
    return state.correctIndices.some((i) => i >= 0 && i < options.length)
  }
  return true
}

export function canSubmitCreate(state: CreateCustomFormState): boolean {
  if (!state.title.trim() || !state.prompt.trim()) return false
  if (state.format === "mcq") return canSubmitMcq(state)
  return true
}
