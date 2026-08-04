import {
  memo,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react"
import { RichTextField, type RichTextToolbarLabels } from "@mockmatch/document-editor"
import type {
  ConnectorElement,
  PathElement,
  ShapeElement,
  ShapeLabelEditorLabels,
  StickyElement,
  TextElement,
  WhiteboardDocument,
  WhiteboardElement,
} from "../types"
import type { ElementViewProps } from "./element-types"

export type { ElementViewProps } from "./element-types"
import { resolveConnectorPoint } from "../document"
import {
  elementPorts,
  elbowPolyline,
  resizeHandlePoints,
} from "../lib/flowchart"
import { isBlankHtml } from "../lib/html"
import { cn } from "@mockmatch/ui/utils"

function toRichLabels(labels: ShapeLabelEditorLabels): RichTextToolbarLabels {
  return {
    bold: labels.bold,
    italic: labels.italic,
    underline: labels.underline,
    list: labels.list,
    link: labels.link,
    clear: labels.clear,
    linkPrompt: labels.linkPrompt,
  }
}

/** Lexical theme classes for non-editing HTML preview. */
const LABEL_HTML_CLASS =
  "[&_p]:m-0 [&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_i]:italic [&_u]:underline [&_s]:line-through [&_a]:text-blue-600 [&_a]:underline"

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
          className="pan-ignore absolute z-20 size-3.5 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-blue-500 bg-white shadow-sm hover:scale-125"
          style={{ left: p.x - el.x, top: p.y - el.y }}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
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
  passThrough,
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
  readonly passThrough?: boolean
  readonly onPortPointerDown?: ElementViewProps["onPortPointerDown"]
  readonly onResizePointerDown?: ElementViewProps["onResizePointerDown"]
}) {
  return (
    <div
      data-el-id={el.id}
      className={cn(
        "pan-ignore absolute rounded-sm shadow-md",
        "border border-black/10",
        passThrough && "pointer-events-none"
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
        if (passThrough) return
        e.stopPropagation()
        onSelect(el.id)
        onPointerDownElement?.(el.id, e)
      }}
    >
      <SelectionRing w={el.w} h={el.h} selected={selected} />
      <textarea
        data-wb-native-edit=""
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
  passThrough,
  editing,
  onStartTextEdit,
  onEndTextEdit,
}: {
  readonly el: TextElement
  readonly selected: boolean
  readonly canEdit: boolean
  readonly onSelect: (id: string) => void
  readonly onTextChange?: (id: string, text: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
  readonly passThrough?: boolean
  /** Double-click / text-tool create → inline edit. */
  readonly editing?: boolean
  readonly onStartTextEdit?: (id: string) => void
  readonly onEndTextEdit?: () => void
}) {
  const editRef = useRef<HTMLDivElement>(null)
  const textSnapshotRef = useRef(el.text)
  textSnapshotRef.current = el.text

  // Seed DOM once on enter-edit; avoid React children overwriting keystrokes.
  useEffect(() => {
    if (!editing) return
    const t = window.setTimeout(() => {
      const node = editRef.current
      if (!node) return
      node.textContent = textSnapshotRef.current
      node.focus()
      const range = document.createRange()
      range.selectNodeContents(node)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }, 0)
    return () => window.clearTimeout(t)
  }, [editing])

  return (
    <div
      data-el-id={el.id}
      className={cn("pan-ignore absolute", passThrough && "pointer-events-none")}
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        minHeight: el.h,
        zIndex: el.z,
      }}
      onPointerDown={(e) => {
        if (passThrough) return
        // Double-click → edit (skip drag)
        if (e.detail >= 2 && canEdit) {
          e.stopPropagation()
          e.preventDefault()
          onSelect(el.id)
          onStartTextEdit?.(el.id)
          return
        }
        if (editing) {
          e.stopPropagation()
          return
        }
        e.stopPropagation()
        onSelect(el.id)
        onPointerDownElement?.(el.id, e)
      }}
      onDoubleClick={(e) => {
        if (passThrough || !canEdit) return
        e.stopPropagation()
        e.preventDefault()
        onSelect(el.id)
        onStartTextEdit?.(el.id)
      }}
    >
      <SelectionRing w={el.w} h={el.h} selected={selected || Boolean(editing)} />
      <div
        ref={editRef}
        className={cn(
          "pan-ignore w-full outline-none empty:before:pointer-events-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)]",
          canEdit && (editing ? "cursor-text" : "cursor-default")
        )}
        style={{ fontSize: el.fontSize }}
        data-placeholder="Type…"
        contentEditable={Boolean(editing && canEdit)}
        suppressContentEditableWarning
        onBlur={(e) => {
          onTextChange?.(el.id, e.currentTarget.textContent ?? "")
          onEndTextEdit?.()
        }}
        onPointerDown={(e) => {
          if (editing && canEdit) e.stopPropagation()
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            ;(e.target as HTMLElement).blur()
          }
        }}
      >
        {editing ? null : el.text}
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
  passThrough,
  editing,
  onStartLabelEdit,
  onEndLabelEdit,
  onLabelChange,
  shapeLabelLabels,
  onPortPointerDown,
  onResizePointerDown,
}: {
  readonly el: ShapeElement
  readonly selected: boolean
  readonly canEdit: boolean
  readonly onSelect: (id: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
  readonly showPorts?: boolean
  readonly passThrough?: boolean
  readonly editing?: boolean
  readonly onStartLabelEdit?: (id: string) => void
  readonly onEndLabelEdit?: () => void
  readonly onLabelChange?: (id: string, html: string) => void
  readonly shapeLabelLabels?: ShapeLabelEditorLabels
  readonly onPortPointerDown?: ElementViewProps["onPortPointerDown"]
  readonly onResizePointerDown?: ElementViewProps["onResizePointerDown"]
}) {
  const labelShellRef = useRef<HTMLDivElement>(null)
  const isLineLike =
    el.shape === "line" ||
    el.shape === "arrow" ||
    el.shape === "elbowArrow" ||
    el.shape === "divider"

  // Focus Lexical contenteditable when entering edit mode
  useEffect(() => {
    if (!editing) return
    const t = window.setTimeout(() => {
      const root = labelShellRef.current?.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement | null
      root?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [editing])

  return (
    <div
      data-el-id={el.id}
      className={cn(
        "pan-ignore absolute flex items-center justify-center",
        passThrough && "pointer-events-none"
      )}
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        zIndex: el.z,
      }}
      onPointerDown={(e) => {
        if (passThrough) return
        // Editing label: let RTE handle; don't start move
        if (editing && (e.target as HTMLElement).closest("[data-shape-label-editor]")) {
          e.stopPropagation()
          return
        }
        // Double-click → label edit (skip drag)
        if (e.detail >= 2 && canEdit && !isLineLike) {
          e.stopPropagation()
          e.preventDefault()
          onSelect(el.id)
          onStartLabelEdit?.(el.id)
          return
        }
        e.stopPropagation()
        onSelect(el.id)
        onPointerDownElement?.(el.id, e)
      }}
      onDoubleClick={(e) => {
        if (passThrough || !canEdit || isLineLike) return
        e.stopPropagation()
        e.preventDefault()
        onSelect(el.id)
        onStartLabelEdit?.(el.id)
      }}
    >
      <SelectionRing w={el.w} h={el.h} selected={selected || Boolean(editing)} />
      <svg
        width={el.w}
        height={el.h}
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        {shapeSvgInner(el)}
      </svg>

      {!isLineLike ? (
        <div
          ref={labelShellRef}
          data-shape-label-editor={editing ? "" : undefined}
          className={cn(
            "relative z-[1] flex max-h-full max-w-full items-center justify-center overflow-hidden px-2",
            editing ? "min-h-[1.5em] w-[min(100%,12rem)]" : "pointer-events-none"
          )}
          onPointerDown={(e) => {
            if (editing) e.stopPropagation()
          }}
        >
          {editing && canEdit && shapeLabelLabels ? (
            <RichTextField
              value={el.label ?? ""}
              onChange={(html) => onLabelChange?.(el.id, html)}
              labels={toRichLabels(shapeLabelLabels)}
              placeholder={shapeLabelLabels.placeholder}
              ariaLabel={shapeLabelLabels.placeholder}
              grammar={false}
              className={cn(
                "w-full text-center text-sm font-medium text-neutral-800 outline-none",
                LABEL_HTML_CLASS
              )}
            />
          ) : !isBlankHtml(el.label) ? (
            <div
              className={cn(
                "text-center text-sm font-medium text-neutral-800",
                LABEL_HTML_CLASS
              )}
              // Label HTML is authored on this board via Lexical only.
              dangerouslySetInnerHTML={{ __html: el.label ?? "" }}
            />
          ) : selected && canEdit ? (
            <span className="select-none text-center text-xs text-neutral-400">
              {shapeLabelLabels?.placeholder ?? "Double-click to type"}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* End edit when focus leaves the shape label (toolbar clicks excluded by RTE). */}
      {editing ? (
        <ShapeLabelBlurGuard
          shellRef={labelShellRef}
          onEnd={() => onEndLabelEdit?.()}
        />
      ) : null}

      <BoxChrome
        el={el}
        selected={selected || Boolean(editing)}
        showPorts={showPorts || selected}
        canEdit={canEdit && !editing}
        onPortPointerDown={onPortPointerDown}
        onResizePointerDown={onResizePointerDown}
      />
    </div>
  )
}

/** Blur / outside pointer → leave label edit (toolbar uses data-rte-toolbar). */
function ShapeLabelBlurGuard({
  shellRef,
  onEnd,
}: {
  readonly shellRef: RefObject<HTMLDivElement | null>
  readonly onEnd: () => void
}) {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const shell = shellRef.current
      const target = event.target as Node | null
      if (!shell || !target) return
      if (shell.contains(target)) return
      if (target instanceof Element && target.closest("[data-rte-toolbar]")) return
      onEnd()
    }
    // Capture so we run before board deselect/move
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => document.removeEventListener("pointerdown", onPointerDown, true)
  }, [shellRef, onEnd])
  return null
}

export function PathView({
  el,
  selected,
  onSelect,
  onPointerDownElement,
  passThrough,
}: {
  readonly el: PathElement
  readonly selected: boolean
  readonly onSelect: (id: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
  readonly passThrough?: boolean
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
          pointerEvents: passThrough ? "none" : "stroke",
          mixBlendMode: isHighlighter ? "multiply" : "normal",
        }}
        onPointerDown={(e) => {
          if (passThrough) return
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
  passThrough,
}: {
  readonly el: ConnectorElement
  readonly doc: WhiteboardDocument
  readonly selected: boolean
  readonly onSelect: (id: string) => void
  readonly onPointerDownElement?: (id: string, e: ReactPointerEvent) => void
  readonly passThrough?: boolean
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
        style={{ pointerEvents: passThrough ? "none" : "stroke" }}
        onPointerDown={(e) => {
          if (passThrough) return
          e.stopPropagation()
          onSelect(el.id)
          onPointerDownElement?.(el.id, e)
        }}
      />
    </svg>
  )
}

/** Built-in renderers (also registered by the elements plugin). */
export function renderDefaultElement(props: ElementViewProps): ReactNode {
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
        passThrough={props.passThrough}
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
        passThrough={props.passThrough}
        editing={props.editingLabelId === el.id}
        onStartTextEdit={props.onStartLabelEdit}
        onEndTextEdit={props.onEndLabelEdit}
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
        passThrough={props.passThrough}
        editing={props.editingLabelId === el.id}
        onStartLabelEdit={props.onStartLabelEdit}
        onEndLabelEdit={props.onEndLabelEdit}
        onLabelChange={props.onTextChange}
        shapeLabelLabels={props.shapeLabelLabels}
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
        passThrough={props.passThrough}
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
      passThrough={props.passThrough}
    />
  )
}

type ElementViewFullProps = ElementViewProps & {
  readonly renderers?: Map<
    WhiteboardElement["type"],
    (p: ElementViewProps) => ReactNode
  >
}

function ElementViewInner(props: ElementViewFullProps) {
  const custom = props.renderers?.get(props.el.type)
  if (custom) return <>{custom(props)}</>
  return <>{renderDefaultElement(props)}</>
}

/** Skip re-render when element ref + chrome flags unchanged (immutable updates). */
export const ElementView = memo(ElementViewInner, (prev, next) => {
  return (
    prev.el === next.el &&
    prev.doc === next.doc &&
    prev.selected === next.selected &&
    prev.canEdit === next.canEdit &&
    prev.passThrough === next.passThrough &&
    prev.showPorts === next.showPorts &&
    prev.editingLabelId === next.editingLabelId &&
    prev.renderers === next.renderers &&
    prev.shapeLabelLabels === next.shapeLabelLabels &&
    prev.onSelect === next.onSelect &&
    prev.onTextChange === next.onTextChange &&
    prev.onPointerDownElement === next.onPointerDownElement &&
    prev.onPortPointerDown === next.onPortPointerDown &&
    prev.onResizePointerDown === next.onResizePointerDown &&
    prev.onStartLabelEdit === next.onStartLabelEdit &&
    prev.onEndLabelEdit === next.onEndLabelEdit
  )
})
