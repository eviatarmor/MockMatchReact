import type { TrackFormat } from "@/features/simulations/types"

/** URL path segment for IDE formats. */
export type IdeFormatSlug = "code-run" | "workspace"

export type IdeFormatPreset = {
  readonly slug: IdeFormatSlug
  readonly trackFormat: Extract<TrackFormat, "codeRun" | "workspace">
  readonly defaultShowTree: boolean
  readonly titleKey: string
  readonly descriptionKey: string
}

export function isIdeFormatSlug(value: string | undefined): value is IdeFormatSlug {
  return value === "code-run" || value === "workspace"
}
