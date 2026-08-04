import { createConnector, maxZ } from "../../document"
import { closestPort } from "../../lib/flowchart"
import type { ConnectorAnchor } from "../../types"
import type {
  InteractionHost,
  ToolDefinition,
  ToolGesture,
} from "../../core/interaction-types"

type ConnectorGesture = ToolGesture & {
  type: "connector"
  fromId: string | null
  fromAnchor: ConnectorAnchor | null
  fromX: number
  fromY: number
}

function draftLine(x1: number, y1: number, x2: number, y2: number) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ width: 1, height: 1 }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#60a5fa"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
    </svg>
  )
}

function commitConnector(g: ConnectorGesture, p: { boardX: number; boardY: number }, host: InteractionHost) {
  if (!host.canEdit()) return
  const toHit = host.hitTestAt(p.boardX, p.boardY)
  const sameAsFrom = Boolean(g.fromId && toHit === g.fromId)
  const toEl =
    toHit && !sameAsFrom ? host.getDocument().elements[toHit] : null
  const toPort = toEl ? closestPort(toEl, p.boardX, p.boardY) : null
  const from =
    g.fromId && host.getDocument().elements[g.fromId]
      ? {
          kind: "element" as const,
          elementId: g.fromId,
          anchor: (g.fromAnchor ?? "c") as ConnectorAnchor,
        }
      : { kind: "point" as const, x: g.fromX, y: g.fromY }
  const to =
    toEl && toHit
      ? {
          kind: "element" as const,
          elementId: toHit,
          anchor: (toPort?.anchor ?? "c") as ConnectorAnchor,
        }
      : { kind: "point" as const, x: p.boardX, y: p.boardY }

  const travel = Math.hypot(p.boardX - g.fromX, p.boardY - g.fromY)
  if (travel < 8) return
  if (
    from.kind === "point" &&
    to.kind === "point" &&
    Math.hypot(from.x - to.x, from.y - to.y) < 8
  ) {
    return
  }
  if (
    from.kind === "element" &&
    to.kind === "element" &&
    from.elementId === to.elementId
  ) {
    return
  }

  const el = createConnector({
    from,
    to,
    routing: "elbow",
    z: maxZ(host.getDocument()) + 1,
  })
  host.dispatch({ type: "upsert", element: el })
  host.setSelectedIds([el.id])
}

export const connectorTool: ToolDefinition = {
  id: "connector",
  cursor: "cell",
  onPointerDown(p, host) {
    if (p.button !== 0 || !host.canEdit()) return null
    p.stopPropagation()
    const hit = host.hitTestAt(p.boardX, p.boardY)
    const hitEl = hit ? host.getDocument().elements[hit] : null
    const port = hitEl ? closestPort(hitEl, p.boardX, p.boardY) : null
    const g: ConnectorGesture = {
      type: "connector",
      fromId: hit,
      fromAnchor: port?.anchor ?? (hit ? "c" : null),
      fromX: port?.x ?? p.boardX,
      fromY: port?.y ?? p.boardY,
    }
    host.setOverlay(
      "draft-line",
      draftLine(g.fromX, g.fromY, p.boardX, p.boardY)
    )
    return g
  },
  onPointerMove(p, gesture, host) {
    if (gesture.type !== "connector") return gesture
    const g = gesture as ConnectorGesture
    host.setOverlay(
      "draft-line",
      draftLine(g.fromX, g.fromY, p.boardX, p.boardY)
    )
    return g
  },
  onPointerUp(p, gesture, host) {
    host.setOverlay("draft-line", null)
    if (gesture.type === "connector") {
      commitConnector(gesture as ConnectorGesture, p, host)
    }
  },
}
