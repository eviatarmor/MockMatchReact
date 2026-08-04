import type { TrackFormat } from "@/features/simulations/types"
import type { RuntimeLanguage } from "@mockmatch/browser-runner"

/**
 * Practice surface slugs.
 * - code-run: `/simulations/code-run/:format`
 * - terminal-lab: `/simulations/terminal-lab` (shell)
 * - workspace: `/simulations/workspace`
 * - bank: `/simulations/:questionId`
 */
export type IdeFormatSlug =
  | "react"
  | "cpp-sort"
  | "js-sum"
  | "ts-sum"
  | "py-hello"
  | "js-fizzbuzz"
  | "js-reverse"
  | "py-factorial"
  | "ts-palindrome"
  | "py-vowels"
  | "shell"
  | "workspace"

/** Formats allowed on `/simulations/code-run/:format`. */
export type CodeRunFormatSlug = Exclude<IdeFormatSlug, "shell" | "workspace">

export type IdeLayoutMode = "ide" | "editor" | "shell"

export type IoTestCase = {
  readonly name: string
  readonly stdin?: string
  readonly expectedStdout?: string
}

export type IdeFormatPreset = {
  readonly slug: IdeFormatSlug
  readonly trackFormat: TrackFormat
  /** Full IDE with file tree. */
  readonly treeEnabled: boolean
  readonly defaultShowTree: boolean
  readonly defaultShowTerminal: boolean
  readonly layout: IdeLayoutMode
  /** Open seed tabs on mount (editor layouts). */
  readonly openSeedTabs: boolean
  /** When false, hide close chrome (code-run single-file). */
  readonly tabsClosable: boolean
  readonly titleKey: string
  readonly descriptionKey: string
  readonly badgeKey: string
  /** Client browser-runner defaults for this format. */
  readonly runtime?: FormatRuntimeHint
}

export const ALL_IDE_FORMAT_SLUGS: readonly IdeFormatSlug[] = [
  "react",
  "cpp-sort",
  "js-sum",
  "ts-sum",
  "py-hello",
  "js-fizzbuzz",
  "js-reverse",
  "py-factorial",
  "ts-palindrome",
  "py-vowels",
  "shell",
  "workspace",
] as const

export const CODE_RUN_FORMAT_SLUGS: readonly CodeRunFormatSlug[] = [
  "react",
  "cpp-sort",
  "js-sum",
  "ts-sum",
  "py-hello",
  "js-fizzbuzz",
  "js-reverse",
  "py-factorial",
  "ts-palindrome",
  "py-vowels",
] as const

export function isIdeFormatSlug(
  value: string | undefined
): value is IdeFormatSlug {
  return (
    value !== undefined &&
    (ALL_IDE_FORMAT_SLUGS as readonly string[]).includes(value)
  )
}

export function isCodeRunFormatSlug(
  value: string | undefined
): value is CodeRunFormatSlug {
  return (
    value !== undefined &&
    (CODE_RUN_FORMAT_SLUGS as readonly string[]).includes(value)
  )
}

/**
 * Any practice slug allowed on `/simulations/code-run/:format`
 * (seed catalog + generated gen-* exercises).
 */
export function isPracticeExerciseSlug(value: string | undefined): boolean {
  if (!value || value === "shell" || value === "workspace") return false
  if (isCodeRunFormatSlug(value)) return true
  if (value.startsWith("gen-")) return true
  // slug-like: lowercase, numbers, hyphens
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(value)
}

/** Default entry + language for client-side runner (when set). */
export type FormatRuntimeHint = {
  readonly language: RuntimeLanguage
  readonly entryPath: string
  /** I/O cases for Run tests */
  readonly tests?: readonly IoTestCase[]
}
