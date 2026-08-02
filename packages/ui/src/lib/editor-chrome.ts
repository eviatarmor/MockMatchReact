/**
 * Shared secondary chrome under the dashboard navbar.
 * Used by resume/cover-letter EditorSecondaryBar, IdeChromeBar, whiteboard shell.
 */

/** Solid surface (non-overlay). Matches content card neutral-50 / neutral-950. */
export const EDITOR_SECONDARY_BAR_SURFACE =
  "border-b border-border/60 bg-neutral-50 dark:bg-neutral-950"

/** Glass over canvas / board — translucent + blur so content peeks through. */
export const EDITOR_SECONDARY_BAR_SURFACE_STUCK =
  "border-b border-border/60 bg-neutral-50/75 backdrop-blur-md dark:bg-neutral-950/75"

/** Standard row metrics (height + padding) — resume-editor reference. */
export const EDITOR_SECONDARY_BAR_ROW =
  "flex h-11 shrink-0 items-center gap-2 px-3 sm:px-4"
