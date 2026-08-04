import type { PointerEvent as ReactPointerEvent } from "react"
import type {
  ConnectorAnchor,
  ShapeLabelEditorLabels,
  WhiteboardDocument,
  WhiteboardElement,
} from "../types"
import type { ResizeHandle } from "../lib/flowchart"

/** Props every element renderer receives (registered via plugins). */
export type ElementViewProps = {
  readonly el: WhiteboardElement
  readonly doc: WhiteboardDocument
  readonly selected: boolean
  readonly canEdit: boolean
  readonly onSelect: (id: string) => void
  readonly onTextChange?: (id: string, text: string) => void
  readonly onPointerDownElement?: (
    id: string,
    e: ReactPointerEvent
  ) => void
  readonly showPorts?: boolean
  readonly passThrough?: boolean
  readonly editingLabelId?: string | null
  readonly onStartLabelEdit?: (id: string) => void
  readonly onEndLabelEdit?: () => void
  readonly shapeLabelLabels?: ShapeLabelEditorLabels
  readonly onPortPointerDown?: (
    elementId: string,
    anchor: ConnectorAnchor,
    e: ReactPointerEvent
  ) => void
  readonly onResizePointerDown?: (
    elementId: string,
    handle: ResizeHandle,
    e: ReactPointerEvent
  ) => void
}
