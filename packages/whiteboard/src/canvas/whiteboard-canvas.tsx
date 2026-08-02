import { useCallback, useEffect, useRef, useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import {
  createConnector,
  createPath,
  createShape,
  createSticky,
  createText,
  hitTest,
  listElementsSorted,
  maxZ,
} from "../document"
import { WHITEBOARD_ZOOM, type WhiteboardViewport } from "../viewport"
import type {
  PathElement,
  WhiteboardCommand,
  WhiteboardDocument,
  WhiteboardTool,
} from "../types"
import { ElementView } from "./elements"

const GRID_DOT_FALLBACK = 24
/** Board plane size (board-space). Centered on first paint. */
const BOARD_SIZE = 3000

export type WhiteboardCanvasProps = {
  readonly document: WhiteboardDocument
  readonly tool: WhiteboardTool
  readonly viewport: WhiteboardViewport
  readonly selectedIds: readonly string[]
  readonly onSelectedIdsChange: (ids: string[]) => void
  readonly onCommand: (command: WhiteboardCommand) => void
  readonly canEdit?: boolean
  readonly shapeKind?: "rect" | "ellipse" | "triangle" | "diamond"
  readonly penColor?: string
  readonly penWidth?: number
  readonly stickyColor?: string
}

type DragState =
  | {
      kind: "move"
      ids: string[]
      lastX: number
      lastY: number
    }
  | {
      kind: "pen"
      id: string
      points: { x: number; y: number }[]
    }
  | {
      kind: "connector"
      fromId: string | null
      fromX: number
      fromY: number
    }
  | null

export function WhiteboardCanvas({
  document: doc,
  tool,
  viewport,
  selectedIds,
  onSelectedIdsChange,
  onCommand,
  canEdit = true,
  shapeKind = "rect",
  penColor = "#171717",
  penWidth = 2,
  stickyColor = "#fef08a",
}: WhiteboardCanvasProps) {
  const { ref, scale, onTransform, bindGridLayer, resetView } = viewport
  const surfaceRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState>(null)
  const [draftPath, setDraftPath] = useState<
    { x: number; y: number }[] | null
  >(null)
  const [draftLine, setDraftLine] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
  } | null>(null)
  const didInitCenter = useRef(false)

  const clientToBoard = useCallback(
    (clientX: number, clientY: number) => {
      const surface = surfaceRef.current
      if (!surface) return { x: 0, y: 0 }
      const rect = surface.getBoundingClientRect()
      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
      }
    },
    [scale]
  )

  useEffect(() => {
    let raf = 0
    const tryBind = () => {
      const wrapper = ref.current?.instance?.wrapperComponent ?? null
      if (wrapper) {
        bindGridLayer(wrapper)
        return
      }
      raf = requestAnimationFrame(tryBind)
    }
    tryBind()
    return () => cancelAnimationFrame(raf)
  }, [ref, bindGridLayer])

  const onBoardPointerDown = (e: React.PointerEvent) => {
    // Left button only for tools; middle = pan (library). Pan tool leaves drag to transform.
    if (e.button !== 0) return
    if (tool === "pan") return
    if (!canEdit && tool !== "select") return

    // Don't start tool when middle-button pan
    if (e.buttons === 4) return

    const { x, y } = clientToBoard(e.clientX, e.clientY)

    if (tool === "select") {
      const hit = hitTest(doc, x, y)
      if (hit) {
        e.stopPropagation()
        onSelectedIdsChange([hit])
        dragRef.current = {
          kind: "move",
          ids: [hit],
          lastX: x,
          lastY: y,
        }
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      } else {
        onSelectedIdsChange([])
      }
      return
    }

    if (!canEdit) return

    // Capture so transform pan never steals the stroke
    e.stopPropagation()

    if (tool === "sticky") {
      const el = createSticky({
        x: x - 80,
        y: y - 70,
        color: stickyColor,
        z: maxZ(doc) + 1,
      })
      onCommand({ type: "upsert", element: el })
      onSelectedIdsChange([el.id])
      return
    }

    if (tool === "text") {
      const el = createText({
        x,
        y,
        z: maxZ(doc) + 1,
      })
      onCommand({ type: "upsert", element: el })
      onSelectedIdsChange([el.id])
      return
    }

    if (tool === "shape") {
      const el = createShape({
        x: x - 70,
        y: y - 40,
        shape: shapeKind,
        z: maxZ(doc) + 1,
      })
      onCommand({ type: "upsert", element: el })
      onSelectedIdsChange([el.id])
      return
    }

    if (tool === "pen") {
      const el = createPath({
        points: [{ x, y }],
        stroke: penColor,
        strokeWidth: penWidth,
        z: maxZ(doc) + 1,
      })
      dragRef.current = {
        kind: "pen",
        id: el.id,
        points: [{ x, y }],
      }
      setDraftPath([{ x, y }])
      onCommand({ type: "upsert", element: el })
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      return
    }

    if (tool === "connector") {
      const hit = hitTest(doc, x, y)
      dragRef.current = {
        kind: "connector",
        fromId: hit,
        fromX: x,
        fromY: y,
      }
      setDraftLine({ x1: x, y1: y, x2: x, y2: y })
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    }
  }

  const onBoardPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = clientToBoard(e.clientX, e.clientY)

    if (drag.kind === "move" && canEdit) {
      const dx = x - drag.lastX
      const dy = y - drag.lastY
      if (dx !== 0 || dy !== 0) {
        onCommand({ type: "move", ids: drag.ids, dx, dy })
        dragRef.current = { ...drag, lastX: x, lastY: y }
      }
      return
    }

    if (drag.kind === "pen") {
      const last = drag.points[drag.points.length - 1]
      if (last && Math.hypot(last.x - x, last.y - y) < 2) return
      const nextPts = [...drag.points, { x, y }]
      dragRef.current = { ...drag, points: nextPts }
      setDraftPath(nextPts)
      onCommand({
        type: "patch",
        id: drag.id,
        patch: { points: nextPts } as Partial<PathElement>,
      })
      return
    }

    if (drag.kind === "connector") {
      setDraftLine({
        x1: drag.fromX,
        y1: drag.fromY,
        x2: x,
        y2: y,
      })
    }
  }

  const onBoardPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current
    dragRef.current = null
    setDraftPath(null)
    setDraftLine(null)

    if (!drag || drag.kind !== "connector" || !canEdit) return

    const { x, y } = clientToBoard(e.clientX, e.clientY)
    const toHit = hitTest(doc, x, y)
    const from =
      drag.fromId && doc.elements[drag.fromId]
        ? {
            kind: "element" as const,
            elementId: drag.fromId,
            anchor: "c" as const,
          }
        : { kind: "point" as const, x: drag.fromX, y: drag.fromY }
    const to =
      toHit && doc.elements[toHit]
        ? {
            kind: "element" as const,
            elementId: toHit,
            anchor: "c" as const,
          }
        : { kind: "point" as const, x, y }

    if (
      from.kind === "point" &&
      to.kind === "point" &&
      Math.hypot(from.x - to.x, from.y - to.y) < 4
    ) {
      return
    }

    const el = createConnector({
      from,
      to,
      z: maxZ(doc) + 1,
    })
    onCommand({ type: "upsert", element: el })
    onSelectedIdsChange([el.id])
  }

  const elements = listElementsSorted(doc)

  const isPanTool = tool === "pan"
  const cursor =
    isPanTool
      ? "grab"
      : tool === "select"
        ? "default"
        : tool === "pen"
          ? "crosshair"
          : "cell"

  return (
    <TransformWrapper
      ref={ref}
      initialScale={WHITEBOARD_ZOOM.default}
      minScale={WHITEBOARD_ZOOM.min}
      maxScale={WHITEBOARD_ZOOM.max}
      centerOnInit={false}
      initialPositionX={0}
      initialPositionY={0}
      limitToBounds={false}
      doubleClick={{ disabled: true }}
      // Wheel zoom handled in useWhiteboardViewport (fixed step)
      wheel={{ disabled: true }}
      panning={{
        // Select/draw: left-click never pans (tools own the pointer).
        // Pan tool: left-drag pans everywhere, including over objects.
        // Always: middle-click pan, Space+drag pan.
        excluded: isPanTool ? [] : ["pan-ignore"],
        allowLeftClickPan: isPanTool,
        allowMiddleClickPan: true,
        activationKeys: ["Space"],
      }}
      onInit={() => {
        if (didInitCenter.current) return
        didInitCenter.current = true
        // Center board under viewport after layout
        requestAnimationFrame(() => resetView())
      }}
      onTransform={onTransform}
    >
      <TransformComponent
        wrapperClass="!absolute !inset-0 !z-0 !h-full !w-full bg-neutral-100 dark:bg-neutral-950 [--dot:var(--color-neutral-300)] dark:[--dot:var(--color-neutral-600)]"
        wrapperStyle={{
          backgroundImage:
            "radial-gradient(circle, var(--dot) 1px, transparent 1px)",
          backgroundSize: `${GRID_DOT_FALLBACK}px ${GRID_DOT_FALLBACK}px`,
          backgroundPosition: "0px 0px",
          cursor,
        }}
      >
        <div
          ref={surfaceRef}
          className="relative"
          style={{
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            cursor,
          }}
          onPointerDown={onBoardPointerDown}
          onPointerMove={onBoardPointerMove}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={onBoardPointerUp}
        >
          {elements.map((el) => (
            <ElementView
              key={el.id}
              el={el}
              doc={doc}
              selected={selectedIds.includes(el.id)}
              canEdit={canEdit}
              onSelect={(id) => onSelectedIdsChange([id])}
              onTextChange={(id, text) => {
                if (!canEdit) return
                const existing = doc.elements[id]
                if (!existing) return
                if (existing.type === "sticky" || existing.type === "text") {
                  onCommand({
                    type: "patch",
                    id,
                    patch: { text } as Partial<typeof existing>,
                  })
                }
              }}
              onPointerDownElement={(id, ev) => {
                if (tool === "pan") return
                if (tool !== "select" || !canEdit) return
                ev.stopPropagation()
                const { x, y } = clientToBoard(ev.clientX, ev.clientY)
                dragRef.current = {
                  kind: "move",
                  ids: selectedIds.includes(id) ? [...selectedIds] : [id],
                  lastX: x,
                  lastY: y,
                }
                if (!selectedIds.includes(id)) onSelectedIdsChange([id])
                ;(ev.currentTarget as HTMLElement).setPointerCapture?.(
                  ev.pointerId
                )
              }}
            />
          ))}

          {draftPath && draftPath.length > 1 ? (
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              style={{ width: 1, height: 1 }}
            >
              <path
                d={draftPath
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                  .join(" ")}
                fill="none"
                stroke={penColor}
                strokeWidth={penWidth}
                strokeLinecap="round"
              />
            </svg>
          ) : null}

          {draftLine ? (
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              style={{ width: 1, height: 1 }}
            >
              <line
                x1={draftLine.x1}
                y1={draftLine.y1}
                x2={draftLine.x2}
                y2={draftLine.y2}
                stroke="#60a5fa"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            </svg>
          ) : null}
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}
