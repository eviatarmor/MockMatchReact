import type { TrackFormat } from "@/features/simulations/types"

/**
 * Practice surface slugs.
 * - code-run: `/simulations/code-run/:format` (react, cpp-sort)
 * - terminal-lab: `/simulations/terminal-lab` (shell)
 * - workspace: `/simulations/workspace` (freeform multi-file collab)
 */
export type IdeFormatSlug = "react" | "cpp-sort" | "shell" | "workspace"

/** Formats allowed on `/simulations/code-run/:format`. */
export type CodeRunFormatSlug = "react" | "cpp-sort"

export type IdeLayoutMode = "ide" | "editor" | "shell"

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
}

export function isIdeFormatSlug(
  value: string | undefined
): value is IdeFormatSlug {
  return (
    value === "react" ||
    value === "cpp-sort" ||
    value === "shell" ||
    value === "workspace"
  )
}

export function isCodeRunFormatSlug(
  value: string | undefined
): value is CodeRunFormatSlug {
  return value === "react" || value === "cpp-sort"
}
