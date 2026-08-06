import type { ResizeHandle } from "../lib/flowchart"
import { closestPort, elementPorts } from "../lib/flowchart"
import {
  pointerFromEvent,
  type InteractionHost,
  type ToolDefinition,
  type ToolGesture,
} from "../plugin-system"
import type { ConnectorAnchor, WhiteboardDocument } from "../types"

type GestureSession = { toolId: string; data: ToolGesture } | null

function startToolGesture(
  toolId: string,
  def: ToolDefinition | undefined,
  pointer: ReturnType<typeof pointerFromEvent>,
  host: InteractionHost,
  setGesture: (g: GestureSession) => void,
  captureBoard: (e: { pointerId: number }) => void,
  ev: { pointerId: number }
): void {
  if (!def?.onPointerDown) return
  const g = def.onPointerDown(pointer, host)
  if (!g) return
  setGesture({ toolId, data: g })
  captureBoard(ev)
}

function startConnectorFromElement(args: {
  id: string
  ev: React.PointerEvent
  doc: WhiteboardDocument
  toolRegistry: Map<string, ToolDefinition>
  host: InteractionHost
  clientToBoard: (x: number, y: number) => { x: number; y: number }
  setGesture: (g: GestureSession) => void
  captureBoard: (e: { pointerId: number }) => void
}): void {
  const {
    id,
    ev,
    doc,
    toolRegistry,
    host,
    clientToBoard,
    setGesture,
    captureBoard,
  } = args
  ev.stopPropagation()
  ev.preventDefault()
  const { x, y } = clientToBoard(ev.clientX, ev.clientY)
  const hitEl = doc.elements[id]
  const port = hitEl ? closestPort(hitEl, x, y) : null
  const boardX = port?.x ?? x
  const boardY = port?.y ?? y
  const pointer = pointerFromEvent(ev, { x: boardX, y: boardY })
  startToolGesture(
    "connector",
    toolRegistry.get("connector"),
    { ...pointer, boardX, boardY },
    host,
    setGesture,
    captureBoard,
    ev
  )
}

export function handleElementPointerDown(args: {
  id: string
  ev: React.PointerEvent
  tool: string
  canEdit: boolean
  editingLabelId: string | null
  doc: WhiteboardDocument
  toolRegistry: Map<string, ToolDefinition>
  host: InteractionHost
  clientToBoard: (x: number, y: number) => { x: number; y: number }
  setGesture: (g: GestureSession) => void
  captureBoard: (e: { pointerId: number }) => void
}): void {
  const {
    id,
    ev,
    tool,
    canEdit,
    editingLabelId,
    doc,
    toolRegistry,
    host,
    clientToBoard,
    setGesture,
    captureBoard,
  } = args

  if (tool === "pan") return
  if (toolRegistry.get(tool)?.passThroughElements) return
  if (editingLabelId === id) return

  if (tool === "connector" && canEdit) {
    startConnectorFromElement({
      id,
      ev,
      doc,
      toolRegistry,
      host,
      clientToBoard,
      setGesture,
      captureBoard,
    })
    return
  }

  if (tool !== "select" || !canEdit) return
  const board = clientToBoard(ev.clientX, ev.clientY)
  startToolGesture(
    "select",
    toolRegistry.get("select"),
    pointerFromEvent(ev, board),
    host,
    setGesture,
    captureBoard,
    ev
  )
}

export function handlePortPointerDown(args: {
  elementId: string
  anchor: ConnectorAnchor
  ev: React.PointerEvent
  canEdit: boolean
  doc: WhiteboardDocument
  toolRegistry: Map<string, ToolDefinition>
  host: InteractionHost
  setGesture: (g: GestureSession) => void
  captureBoard: (e: { pointerId: number }) => void
}): void {
  const {
    elementId,
    anchor,
    ev,
    canEdit,
    doc,
    toolRegistry,
    host,
    setGesture,
    captureBoard,
  } = args
  if (!canEdit) return
  ev.stopPropagation()
  ev.preventDefault()
  const hitEl = doc.elements[elementId]
  const port = hitEl
    ? elementPorts(hitEl)?.find((p) => p.anchor === anchor)
    : null
  const p = port ?? { x: 0, y: 0, anchor }
  const pointer = pointerFromEvent(ev, { x: p.x, y: p.y })
  startToolGesture(
    "connector",
    toolRegistry.get("connector"),
    { ...pointer, boardX: p.x, boardY: p.y },
    host,
    setGesture,
    captureBoard,
    ev
  )
}

export function handleResizePointerDown(args: {
  elementId: string
  handle: ResizeHandle
  ev: React.PointerEvent
  canEdit: boolean
  doc: WhiteboardDocument
  setGesture: (g: GestureSession) => void
  captureBoard: (e: { pointerId: number }) => void
}): void {
  const {
    elementId,
    handle,
    ev,
    canEdit,
    doc,
    setGesture,
    captureBoard,
  } = args
  if (!canEdit) return
  ev.stopPropagation()
  const hitEl = doc.elements[elementId]
  if (!hitEl || hitEl.type === "path" || hitEl.type === "connector") return
  setGesture({
    toolId: "__resize__",
    data: {
      type: "resize",
      id: elementId,
      handle,
      start: {
        x: hitEl.x,
        y: hitEl.y,
        w: hitEl.w,
        h: hitEl.h,
      },
    },
  })
  captureBoard(ev)
}

export function patchElementText(
  doc: WhiteboardDocument,
  id: string,
  text: string,
  canEdit: boolean,
  dispatch: (cmd: {
    type: "patch"
    id: string
    patch: Record<string, unknown>
  }) => void
): void {
  if (!canEdit) return
  const existing = doc.elements[id]
  if (!existing) return
  if (existing.type === "sticky" || existing.type === "text") {
    dispatch({ type: "patch", id, patch: { text } })
    return
  }
  if (existing.type === "shape") {
    dispatch({ type: "patch", id, patch: { label: text } })
  }
}
