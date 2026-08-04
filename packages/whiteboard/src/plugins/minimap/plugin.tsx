import { memo, useCallback, useEffect, useMemo, useRef } from "react"
import { elementBounds, listElementsSorted } from "../../document"
import type { WhiteboardDocument } from "../../types"
import type { WhiteboardPlugin, WhiteboardPluginContext } from "../../plugin-system"

const MAP_W = 168
const MAP_H = 120
const PAD = 8
const BOARD = 3000
/** Cap freehand points drawn on the minimap. */
const MAX_PATH_SAMPLES = 24

type WorldBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function contentBounds(doc: WhiteboardDocument): WorldBox {
  const els = Object.values(doc.elements)
  if (els.length === 0) {
    return { minX: 0, minY: 0, maxX: BOARD, maxY: BOARD }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const el of els) {
    if (el.type === "connector") continue
    const b = elementBounds(el)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: BOARD, maxY: BOARD }
  }
  const pad = 80
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  }
}

type MapLayout = {
  world: WorldBox
  scale: number
  ox: number
  oy: number
}

function layoutFor(world: WorldBox): MapLayout {
  const worldW = Math.max(1, world.maxX - world.minX)
  const worldH = Math.max(1, world.maxY - world.minY)
  const scale = Math.min(
    (MAP_W - PAD * 2) / worldW,
    (MAP_H - PAD * 2) / worldH
  )
  return {
    world,
    scale,
    ox: PAD + ((MAP_W - PAD * 2) - worldW * scale) / 2,
    oy: PAD + ((MAP_H - PAD * 2) - worldH * scale) / 2,
  }
}

function samplePath(
  points: readonly { x: number; y: number }[]
): readonly { x: number; y: number }[] {
  if (points.length <= MAX_PATH_SAMPLES) return points
  const step = (points.length - 1) / (MAX_PATH_SAMPLES - 1)
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < MAX_PATH_SAMPLES; i++) {
    out.push(points[Math.round(i * step)]!)
  }
  return out
}

/** Static layer: only re-renders when the document reference changes. */
const MinimapContent = memo(function MinimapContent({
  doc,
  layout,
}: {
  doc: WhiteboardDocument
  layout: MapLayout
}) {
  const { world, scale, ox, oy } = layout
  const toMap = (bx: number, by: number) => ({
    x: ox + (bx - world.minX) * scale,
    y: oy + (by - world.minY) * scale,
  })

  const els = useMemo(() => listElementsSorted(doc), [doc])

  return (
    <>
      <rect width={MAP_W} height={MAP_H} className="fill-muted/40" />
      {els.map((el) => {
        if (el.type === "connector") return null
        if (el.type === "path") {
          const pts = samplePath(el.points)
          if (pts.length < 2) return null
          const d = pts
            .map((p, i) => {
              const m = toMap(p.x, p.y)
              return `${i === 0 ? "M" : "L"} ${m.x} ${m.y}`
            })
            .join(" ")
          return (
            <path
              key={el.id}
              d={d}
              fill="none"
              stroke={el.stroke}
              strokeWidth={1}
              opacity={0.7}
            />
          )
        }
        const b = elementBounds(el)
        const p = toMap(b.x, b.y)
        const fill =
          el.type === "sticky"
            ? el.color
            : el.type === "shape"
              ? el.fill === "transparent"
                ? "none"
                : el.fill
              : "#a3a3a3"
        const stroke =
          el.type === "shape" ? el.stroke : "rgba(0,0,0,0.25)"
        return (
          <rect
            key={el.id}
            x={p.x}
            y={p.y}
            width={Math.max(2, b.w * scale)}
            height={Math.max(2, b.h * scale)}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.75}
            opacity={0.85}
            rx={el.type === "sticky" ? 1 : 0.5}
          />
        )
      })}
    </>
  )
})

/**
 * Minimap: document layer memoized; viewport rect updated via DOM +
 * subscribeTransform (no full board re-render on pan).
 */
function MinimapChrome({ ctx }: { ctx: WhiteboardPluginContext }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const viewRectRef = useRef<SVGRectElement>(null)
  const layoutRef = useRef<MapLayout | null>(null)

  const doc = ctx.getDocument()
  const layout = useMemo(() => layoutFor(contentBounds(doc)), [doc])
  layoutRef.current = layout

  const syncViewRect = useCallback(() => {
    const rectEl = viewRectRef.current
    const vp = ctx.getViewport?.()
    const lay = layoutRef.current
    if (!rectEl || !vp || !lay) return
    const { w: wrapW, h: wrapH } = vp.getWrapperSize()
    if (wrapW <= 0 || wrapH <= 0) return
    const s = vp.scale || 1
    const bx0 = -vp.positionX / s
    const by0 = -vp.positionY / s
    const { world, scale, ox, oy } = lay
    rectEl.setAttribute("x", String(ox + (bx0 - world.minX) * scale))
    rectEl.setAttribute("y", String(oy + (by0 - world.minY) * scale))
    rectEl.setAttribute("width", String(Math.max(4, (wrapW / s) * scale)))
    rectEl.setAttribute("height", String(Math.max(4, (wrapH / s) * scale)))
    rectEl.setAttribute("visibility", "visible")
  }, [ctx])

  useEffect(() => {
    syncViewRect()
    const vp = ctx.getViewport?.()
    if (!vp?.subscribeTransform) return
    return vp.subscribeTransform(syncViewRect)
  }, [ctx, syncViewRect, doc])

  const panToClient = useCallback(
    (clientX: number, clientY: number) => {
      const vp = ctx.getViewport?.()
      const lay = layoutRef.current
      if (!vp || !svgRef.current || !lay) return
      const rect = svgRef.current.getBoundingClientRect()
      const mx = clientX - rect.left
      const my = clientY - rect.top
      const bx = lay.world.minX + (mx - lay.ox) / lay.scale
      const by = lay.world.minY + (my - lay.oy) / lay.scale
      vp.centerOnBoardPoint(bx, by)
    },
    [ctx]
  )

  return (
    <div
      className="pointer-events-auto absolute bottom-16 left-3 z-30 overflow-hidden rounded-lg border border-border bg-card/95 shadow-md backdrop-blur"
      data-wb-minimap=""
    >
      <svg
        ref={svgRef}
        width={MAP_W}
        height={MAP_H}
        className="block cursor-crosshair"
        onPointerDown={(e) => {
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          panToClient(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return
          panToClient(e.clientX, e.clientY)
        }}
      >
        <MinimapContent doc={doc} layout={layout} />
        <rect
          ref={viewRectRef}
          fill="rgba(59,130,246,0.12)"
          stroke="#3b82f6"
          strokeWidth={1.25}
          visibility="hidden"
        />
      </svg>
    </div>
  )
}

export function createMinimapPlugin(): WhiteboardPlugin {
  return {
    id: "minimap",
    order: 200,
    renderChrome: (ctx) => <MinimapChrome ctx={ctx} />,
  }
}
