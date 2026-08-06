import type { ReactNode } from "react"
import type { ResizeHandle } from "../lib/flowchart"
import type {
  ShapeLabelEditorLabels,
  WhiteboardDocument,
  WhiteboardElement,
  WhiteboardTool,
  ConnectorAnchor,
} from "../types"
import { collectElements } from "../plugin-system"
import { ElementView } from "./elements"

const BOARD_SIZE = 3000

type ElementRenderers = ReturnType<typeof collectElements>

export function BoardSurface(props: {
  surfaceRef: (el: HTMLDivElement | null) => void
  cursor: string
  doc: WhiteboardDocument
  elements: readonly WhiteboardElement[]
  selectedSet: Set<string>
  canEdit: boolean
  renderers: ElementRenderers
  tool: WhiteboardTool
  editingLabelId: string | null
  shapeLabelLabels?: ShapeLabelEditorLabels
  passThroughElements: boolean
  overlays: Record<string, ReactNode>
  pluginOverlays: readonly { id: string; node: ReactNode }[]
  boardOverlay?: ReactNode
  onBoardPointerDown: (e: React.PointerEvent | PointerEvent) => void
  onBoardPointerMove: (e: React.PointerEvent) => void
  onBoardPointerUp: (e: React.PointerEvent) => void
  onBoardDoubleClick: (e: React.MouseEvent) => void
  onStartLabelEdit: (id: string) => void
  onEndLabelEdit: () => void
  onSelectElement: (id: string) => void
  onTextChange: (id: string, text: string) => void
  onPointerDownElement: (id: string, ev: React.PointerEvent) => void
  onPortPointerDown: (
    elementId: string,
    anchor: ConnectorAnchor,
    ev: React.PointerEvent
  ) => void
  onResizePointerDown: (
    elementId: string,
    handle: ResizeHandle,
    ev: React.PointerEvent
  ) => void
}) {
  const {
    surfaceRef,
    cursor,
    doc,
    elements,
    selectedSet,
    canEdit,
    renderers,
    tool,
    editingLabelId,
    shapeLabelLabels,
    passThroughElements,
    overlays,
    pluginOverlays,
    boardOverlay,
    onBoardPointerDown,
    onBoardPointerMove,
    onBoardPointerUp,
    onBoardDoubleClick,
    onStartLabelEdit,
    onEndLabelEdit,
    onSelectElement,
    onTextChange,
    onPointerDownElement,
    onPortPointerDown,
    onResizePointerDown,
  } = props

  return (
    <div
      ref={surfaceRef}
      className="relative"
      style={{ width: BOARD_SIZE, height: BOARD_SIZE, cursor }}
      onPointerDown={onBoardPointerDown}
      onPointerMove={onBoardPointerMove}
      onPointerUp={onBoardPointerUp}
      onPointerCancel={onBoardPointerUp}
      onDoubleClick={onBoardDoubleClick}
    >
      {elements.map((el) => (
        <ElementView
          key={el.id}
          el={el}
          doc={doc}
          selected={selectedSet.has(el.id)}
          canEdit={canEdit}
          renderers={renderers}
          showPorts={
            !editingLabelId && (tool === "connector" || selectedSet.has(el.id))
          }
          passThrough={passThroughElements}
          editingLabelId={editingLabelId}
          shapeLabelLabels={shapeLabelLabels}
          onStartLabelEdit={onStartLabelEdit}
          onEndLabelEdit={onEndLabelEdit}
          onSelect={onSelectElement}
          onTextChange={onTextChange}
          onPointerDownElement={onPointerDownElement}
          onPortPointerDown={onPortPointerDown}
          onResizePointerDown={onResizePointerDown}
        />
      ))}

      {Object.entries(overlays).map(([key, node]) => (
        <div key={key} data-wb-overlay={key}>
          {node}
        </div>
      ))}

      {pluginOverlays.map(({ id, node }) => (
        <div
          key={id}
          className="pointer-events-none absolute inset-0"
          data-wb-plugin-overlay={id}
        >
          {node}
        </div>
      ))}

      {boardOverlay}
    </div>
  )
}
