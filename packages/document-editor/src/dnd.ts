import type { Modifier } from "@dnd-kit/core"

/**
 * dnd-kit modifier that divides the drag transform by the canvas zoom. dnd-kit
 * measures in screen pixels, so inside a CSS `transform: scale()` container the
 * dragged element drifts ahead of the cursor without this correction.
 */
export const createScaleModifier =
  (scale: number): Modifier =>
  ({ transform }) => ({ ...transform, x: transform.x / scale, y: transform.y / scale })
