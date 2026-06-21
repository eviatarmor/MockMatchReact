import { WorkerLinter, type Lint } from "harper.js"
import { binaryInlined } from "harper.js/binaryInlined"

/** A single grammar problem, flattened to plain serializable data (Harper's
 * `Lint`/`Span`/`Suggestion` objects hold WASM memory we don't want to leak). */
export interface GrammarIssue {
  /** Character offset (inclusive) of the problem in the linted text. */
  readonly start: number
  /** Character offset (exclusive) of the problem. */
  readonly end: number
  /** The offending substring. */
  readonly text: string
  /** Human-readable description. */
  readonly message: string
  /** Category, e.g. "Spelling", "Grammar", "WordChoice". */
  readonly kind: string
  /** Replacement strings the user can apply, in Harper's preferred order. */
  readonly replacements: readonly string[]
}

let linterPromise: Promise<WorkerLinter> | null = null

/**
 * Lazily build a single shared linter with **every** rule enabled. Harper ships
 * many rules off by default; we turn them all on per the product requirement.
 * Runs on a web worker so large documents never block the event loop.
 */
async function getLinter(): Promise<WorkerLinter> {
  if (!linterPromise) {
    linterPromise = (async () => {
      const linter = new WorkerLinter({ binary: binaryInlined })
      await linter.setup()
      // Force-enable all rules: start from the default config and set every key
      // to `true` (default leaves many as `null` = rule's own default/off).
      const config = await linter.getDefaultLintConfig()
      const allOn = Object.fromEntries(Object.keys(config).map((rule) => [rule, true]))
      await linter.setLintConfig(allOn)
      return linter
    })()
  }
  return linterPromise
}

function toIssue(lint: Lint): GrammarIssue {
  const span = lint.span()
  return {
    start: span.start,
    end: span.end,
    text: lint.get_problem_text(),
    message: lint.message(),
    kind: lint.lint_kind(),
    replacements: lint.suggestions().map((s) => s.get_replacement_text()),
  }
}

/** Lint a plain-text string and return flattened, serializable issues. */
export async function lintText(text: string): Promise<GrammarIssue[]> {
  if (!text.trim()) return []
  const linter = await getLinter()
  const lints = await linter.lint(text, { language: "plaintext" })
  return lints.map(toIssue)
}
