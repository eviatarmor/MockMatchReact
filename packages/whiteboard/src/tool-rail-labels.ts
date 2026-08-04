import type { ToolRailLabels } from "./types"

/** Labels the left tool rail + tool plugins need from the host. */
export type WhiteboardToolRailLabels = ToolRailLabels & {
  readonly draw: string
  readonly shapesTitle: string
  readonly stickyColor: string
  readonly resolveShapeLabel: (key: string) => string
}
