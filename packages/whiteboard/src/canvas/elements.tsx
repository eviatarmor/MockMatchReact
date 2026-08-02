import type { PointerEvent as ReactPointerEvent, ReactNode } from "react"
import type {
  ConnectorAnchor,
  ConnectorElement,
  PathElement,
  ShapeElement,
  StickyElement,
  TextElement,
  WhiteboardDocument,
  WhiteboardElement,
} from "../types"
import { resolveConnectorPoint } from "../document"
import {
  elementPorts,
  elbowPolyline,
  resizeHandlePoints,
  type ResizeHandle,
} from "../lib/flowchart"
import { cn } from "@mockmatch/ui/utils"

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
  /** Show N/S/E/W ports (connector tool or selected architecture nodes). */
  readonly showPorts?: boolean
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

function SelectionRing({
  w,
  h,
  selected,
}: {
  readonly w: number
  readonly h: number
  readonly selected: boolean
}) {
  if (!selected) return null
  return (
    <div
      className="pointer-events-none absolute -inset-0.5 rounded-md ring-2 ring-blue-400 ring-offset-1"
      style={{ width: w + 4, height: h + 4, left: -2, top: -2 }}
    />
  )
}

function BoxChrome({
  el,
  selected,
  showPorts,
  canEdit,
  onPortPointerDown,
  onResizePointerDown,
}: {
  readonly el: Extract<WhiteboardElement, { w: number; h: number; x: number; y: number }>
  readonly selected: boolean
  readonly showPorts?: boolean
  readonly canEdit: boolean
  readonly onPortPointerDown?: ElementViewProps["onPortPointerDown"]
  readonly onResizePointerDown?: ElementViewProps["onResizePointerDown"]
}) {
  const ports = showPorts ? elementPorts(el) : null
  const handles =
    selected && canEdit ? resizeHandlePoints(0, 0, el.w, el.h) : []

  return (
    <>
      {ports?.map((p) => (
        <button
          key={p.anchor}
          type="button"
          aria-label={`Connect ${p.anchor}`}
          className="pan-ignore absolute z-20 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-white shadow-sm hover:scale-125"
          style={{ left: p.x - el.x, top: p.y - el.y }}
          onPointerDown={(e) => {
            e.stopPropagation()
            onPortPointerDown?.(el.id, p.anchor, e)
          }}
        />
      ))}
      {handles.map((h) => (
        <button
          key={h.id}
          type="button"
          aria-label={`Resize ${h.id}`}
          className={cn(
            "pan-ignore absolute z-20 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-blue-500 bg-white shadow-sm",
            (h.id === "n" || h.id === "s") && "cursor-ns-resize",
            (h.id === "e" || h.id === "w") && "cursor-ew-resize",
            (h.id === "nw" || h.id === "se") && "cursor-nwse-resize",
            (h.id === "ne" || h.id === "sw") && "cursor-nesw-resize"
          )}
          style={{ left: h.x, top: h.y }}
          onPointerDown={(e) => {
            e.stopPropagation()
            onResizePointerDown?.(el.id, h.id, e)
          }}
        />
      ))}
    </>
  )
}

export function StickyView({
  el,
  selected,
  canEdit,
  onSelect,
  onTextChange,
  onPointerDownElement,
  showPorts,
  onPortPointerDown,
  onResizePointerDown,
}: {
  readonly el: StickyElement
  readonly selected: boolean
  readonly canEdit: boolean
  readonly onSelect: (id: string) => void
  readonly onTextChange?: (id: string, text: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
  readonly showPorts?: boolean
  readonly onPortPointerDown?: ElementViewProps["onPortPointerDown"]
  readonly onResizePointerDown?: ElementViewProps["onResizePointerDown"]
}) {
  return (
    <div
      data-el-id={el.id}
      className={cn(
        "pan-ignore absolute rounded-sm shadow-md",
        "border border-black/10"
      )}
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        zIndex: el.z,
        backgroundColor: el.color,
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect(el.id)
        onPointerDownElement?.(el.id, e)
      }}
    >
      <SelectionRing w={el.w} h={el.h} selected={selected} />
      <textarea
        className="pan-ignore size-full resize-none overflow-hidden bg-transparent p-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-500"
        value={el.text}
        disabled={!canEdit}
        placeholder="Note…"
        onChange={(e) => onTextChange?.(el.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <BoxChrome
        el={el}
        selected={selected}
        showPorts={showPorts || selected}
        canEdit={canEdit}
        onPortPointerDown={onPortPointerDown}
        onResizePointerDown={onResizePointerDown}
      />
    </div>
  )
}

export function TextView({
  el,
  selected,
  canEdit,
  onSelect,
  onTextChange,
  onPointerDownElement,
}: {
  readonly el: TextElement
  readonly selected: boolean
  readonly canEdit: boolean
  readonly onSelect: (id: string) => void
  readonly onTextChange?: (id: string, text: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
}) {
  return (
    <div
      data-el-id={el.id}
      className="pan-ignore absolute"
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        minHeight: el.h,
        zIndex: el.z,
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect(el.id)
        onPointerDownElement?.(el.id, e)
      }}
    >
      <SelectionRing w={el.w} h={el.h} selected={selected} />
      <div
        className={cn(
          "pan-ignore w-full outline-none",
          canEdit && "cursor-text"
        )}
        style={{ fontSize: el.fontSize }}
        contentEditable={canEdit}
        suppressContentEditableWarning
        onBlur={(e) =>
          onTextChange?.(el.id, e.currentTarget.textContent ?? "")
        }
        onPointerDown={(e) => {
          if (canEdit) e.stopPropagation()
        }}
      >
        {el.text}
      </div>
    </div>
  )
}

function shapeSvgInner(el: ShapeElement): ReactNode {
  const { w, h, shape, fill, stroke } = el
  const sw = 2
  if (shape === "rect") {
    return (
      <rect
        x={1}
        y={1}
        width={w - 2}
        height={h - 2}
        rx={6}
        fill={fill === "transparent" ? "none" : fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    )
  }
  if (shape === "ellipse") {
    return (
      <ellipse
        cx={w / 2}
        cy={h / 2}
        rx={w / 2 - 1}
        ry={h / 2 - 1}
        fill={fill === "transparent" ? "none" : fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    )
  }
  if (shape === "triangle") {
    return (
      <path
        d={`M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`}
        fill={fill === "transparent" ? "none" : fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    )
  }
  if (shape === "diamond") {
    return (
      <path
        d={`M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`}
        fill={fill === "transparent" ? "none" : fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    )
  }
  if (shape === "line" || shape === "divider") {
    const y = h / 2
    return (
      <line
        x1={0}
        y1={y}
        x2={w}
        y2={y}
        stroke={stroke}
        strokeWidth={shape === "divider" ? 2 : sw}
      />
    )
  }
  if (shape === "arrow") {
    const y = h / 2
    const head = Math.min(14, w * 0.25)
    return (
      <>
        <line x1={0} y1={y} x2={w - head} y2={y} stroke={stroke} strokeWidth={sw} />
        <path
          d={`M ${w - head} ${y - 7} L ${w} ${y} L ${w - head} ${y + 7}`}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </>
    )
  }
  if (shape === "elbowArrow") {
    const midX = w * 0.55
    const head = 10
    return (
      <>
        <path
          d={`M 0 ${h / 2} L ${midX} ${h / 2} L ${midX} ${h * 0.2} L ${w - head} ${h * 0.2}`}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
        />
        <path
          d={`M ${w - head} ${h * 0.2 - 6} L ${w} ${h * 0.2} L ${w - head} ${h * 0.2 + 6}`}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
        />
      </>
    )
  }
  if (shape === "blockArrow") {
    const body = h * 0.35
    const y0 = (h - body) / 2
    const mid = w * 0.55
    return (
      <path
        d={`M 0 ${y0} L ${mid} ${y0} L ${mid} 0 L ${w} ${h / 2} L ${mid} ${h} L ${mid} ${y0 + body} L 0 ${y0 + body} Z`}
        fill={fill === "transparent" ? "none" : fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    )
  }
  return null
}

export function ShapeView({
  el,
  selected,
  canEdit,
  onSelect,
  onPointerDownElement,
  showPorts,
  onPortPointerDown,
  onResizePointerDown,
}: {
  readonly el: ShapeElement
  readonly selected: boolean
  readonly canEdit: boolean
  readonly onSelect: (id: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
  readonly showPorts?: boolean
  readonly onPortPointerDown?: ElementViewProps["onPortPointerDown"]
  readonly onResizePointerDown?: ElementViewProps["onResizePointerDown"]
}) {
  return (
    <div
      data-el-id={el.id}
      className="pan-ignore absolute flex items-center justify-center"
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        zIndex: el.z,
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect(el.id)
        onPointerDownElement?.(el.id, e)
      }}
    >
      <SelectionRing w={el.w} h={el.h} selected={selected} />
      <svg width={el.w} height={el.h} className="absolute inset-0 overflow-visible">
        {shapeSvgInner(el)}
      </svg>
      {el.label ? (
        <span
          className={cn(
            "relative z-[1] px-2 text-center text-sm font-medium text-neutral-800",
            !canEdit && "pointer-events-none"
          )}
        >
          {el.label}
        </span>
      ) : null}
      <BoxChrome
        el={el}
        selected={selected}
        showPorts={showPorts || selected}
        canEdit={canEdit}
        onPortPointerDown={onPortPointerDown}
        onResizePointerDown={onResizePointerDown}
      />
    </div>
  )
}

export function PathView({
  el,
  selected,
  onSelect,
  onPointerDownElement,
}: {
  readonly el: PathElement
  readonly selected: boolean
  readonly onSelect: (id: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
}) {
  if (el.points.length < 2) return null
  const d = el.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")
  const isHighlighter = el.strokeKind === "highlighter"
  // Prefer stored opacity; highlighter defaults semi-transparent for multiply blend
  const opacity = el.opacity ?? (isHighlighter ? 0.35 : 1)
  return (
    <svg
      data-el-id={el.id}
      className="pan-ignore pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: el.z, width: 1, height: 1 }}
    >
      <path
        d={d}
        fill="none"
        stroke={el.stroke}
        strokeWidth={el.strokeWidth + (selected ? 2 : 0)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        className="pointer-events-stroke"
        style={{
          pointerEvents: "stroke",
          mixBlendMode: isHighlighter ? "multiply" : "normal",
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect(el.id)
          onPointerDownElement?.(el.id, e)
        }}
      />
    </svg>
  )
}

function arrowHead(
  from: { x: number; y: number },
  to: { x: number; y: number },
  size = 10
): string {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const a1 = angle + Math.PI * 0.85
  const a2 = angle - Math.PI * 0.85
  const p1 = { x: to.x + size * Math.cos(a1), y: to.y + size * Math.sin(a1) }
  const p2 = { x: to.x + size * Math.cos(a2), y: to.y + size * Math.sin(a2) }
  return `M ${to.x} ${to.y} L ${p1.x} ${p1.y} M ${to.x} ${to.y} L ${p2.x} ${p2.y}`
}

export function ConnectorView({
  el,
  doc,
  selected,
  onSelect,
  onPointerDownElement,
}: {
  readonly el: ConnectorElement
  readonly doc: WhiteboardDocument
  readonly selected: boolean
  readonly onSelect: (id: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
}) {
  const a = resolveConnectorPoint(el.from, doc)
  const b = resolveConnectorPoint(el.to, doc)
  const routing = el.routing ?? "elbow"
  const pts =
    routing === "elbow" ? elbowPolyline(a.x, a.y, b.x, b.y) : [a, b]
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")
  const prev = pts[pts.length - 2] ?? a
  const head = el.endArrow ? arrowHead(prev, b) : ""
  const next = pts[1] ?? b
  const tail = el.startArrow ? arrowHead(next, a) : ""
  return (
    <svg
      data-el-id={el.id}
      className="pan-ignore absolute inset-0 overflow-visible"
      style={{ zIndex: el.z, width: 1, height: 1, pointerEvents: "none" }}
    >
      <path
        d={`${line} ${head} ${tail}`}
        fill="none"
        stroke={selected ? "#60a5fa" : el.stroke}
        strokeWidth={el.strokeWidth + (selected ? 1 : 0)}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: "stroke" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect(el.id)
          onPointerDownElement?.(el.id, e)
        }}
      />
    </svg>
  )
}

export function ElementView(props: ElementViewProps) {
  const { el } = props
  if (el.type === "sticky") {
    return (
      <StickyView
        el={el}
        selected={props.selected}
        canEdit={props.canEdit}
        onSelect={props.onSelect}
        onTextChange={props.onTextChange}
        onPointerDownElement={props.onPointerDownElement}
        showPorts={props.showPorts}
        onPortPointerDown={props.onPortPointerDown}
        onResizePointerDown={props.onResizePointerDown}
      />
    )
  }
  if (el.type === "text") {
    return (
      <TextView
        el={el}
        selected={props.selected}
        canEdit={props.canEdit}
        onSelect={props.onSelect}
        onTextChange={props.onTextChange}
        onPointerDownElement={props.onPointerDownElement}
      />
    )
  }
  if (el.type === "shape") {
    return (
      <ShapeView
        el={el}
        selected={props.selected}
        canEdit={props.canEdit}
        onSelect={props.onSelect}
        onPointerDownElement={props.onPointerDownElement}
        showPorts={props.showPorts}
        onPortPointerDown={props.onPortPointerDown}
        onResizePointerDown={props.onResizePointerDown}
      />
    )
  }
  if (el.type === "path") {
    return (
      <PathView
        el={el}
        selected={props.selected}
        onSelect={props.onSelect}
        onPointerDownElement={props.onPointerDownElement}
      />
    )
  }
  return (
    <ConnectorView
      el={el}
      doc={props.doc}
      selected={props.selected}
      onSelect={props.onSelect}
      onPointerDownElement={props.onPointerDownElement}
    />
  )
}
