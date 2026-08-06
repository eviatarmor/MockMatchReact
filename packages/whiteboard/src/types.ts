/** Board-space coordinates (not screen pixels). */
// whiteboard tool model v2

export type WhiteboardTool =
  | "select"
  | "pan"
  | "pen"
  | "highlighter"
  | "smart"
  | "eraser"
  | "precisionEraser"
  | "lasso"
  | "sticky"
  | "text"
  | "shape"
  | "connector"

export type ShapeKind =
  | "rect"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "line"
  | "arrow"
  | "elbowArrow"
  | "blockArrow"
  | "divider"

/** Drawing tools that live only in the secondary draw rail. */
export type DrawTool =
  | "pen"
  | "highlighter"
  | "smart"
  | "eraser"
  | "precisionEraser"
  | "lasso"

export const DRAW_TOOLS: readonly DrawTool[] = [
  "pen",
  "highlighter",
  "smart",
  "eraser",
  "precisionEraser",
  "lasso",
] as const

export const STICKY_COLOR_PRESETS = [
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#fecaca",
  "#e9d5ff",
  "#fed7aa",
  "#f5f5f5",
  "#fde68a",
] as const

export type PathStrokeKind = "pen" | "highlighter" | "smart"

export type ConnectorAnchor = "n" | "s" | "e" | "w" | "c"

export type ConnectorEnd =
  | { readonly kind: "point"; readonly x: number; readonly y: number }
  | {
      readonly kind: "element"
      readonly elementId: string
      readonly anchor: ConnectorAnchor
    }

export type StickyElement = {
  readonly id: string
  readonly type: "sticky"
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly z: number
  readonly color: string
  readonly text: string
}

export type TextElement = {
  readonly id: string
  readonly type: "text"
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly z: number
  readonly text: string
  readonly fontSize: number
}

export type ShapeElement = {
  readonly id: string
  readonly type: "shape"
  readonly shape: ShapeKind
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly z: number
  readonly fill: string
  readonly stroke: string
  /**
   * Shape label as HTML (Lexical / RichTextField).
   * Plain text is fine; formatting uses <strong>/<em>/<u> etc.
   */
  readonly label?: string
}

/**
 * Stencil icon from the draw.io-derived library.
 * `svg` is embedded so saved boards stay self-contained without the catalog.
 */
export type StencilElement = {
  readonly id: string
  readonly type: "stencil"
  /** Stable catalog id, e.g. `aws.compute.ec2`. */
  readonly stencilId: string
  readonly name: string
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly z: number
  /** Full SVG markup (viewBox + paths). */
  readonly svg: string
  readonly label?: string
}

/** Host i18n for in-shape rich text (bold / italic / underline toolbar). */
export type ShapeLabelEditorLabels = {
  readonly placeholder: string
  readonly bold: string
  readonly italic: string
  readonly underline: string
  readonly list: string
  readonly link: string
  readonly clear: string
  readonly linkPrompt: string
}

export type PathElement = {
  readonly id: string
  readonly type: "path"
  readonly points: readonly { readonly x: number; readonly y: number }[]
  readonly z: number
  readonly stroke: string
  readonly strokeWidth: number
  /** pen | highlighter | smart freehand residue */
  readonly strokeKind?: PathStrokeKind
  /** 0–1; highlighter defaults ~0.35 */
  readonly opacity?: number
}

export type ConnectorRouting = "straight" | "elbow"

export type ConnectorElement = {
  readonly id: string
  readonly type: "connector"
  readonly from: ConnectorEnd
  readonly to: ConnectorEnd
  readonly z: number
  readonly stroke: string
  readonly strokeWidth: number
  readonly startArrow: boolean
  readonly endArrow: boolean
  /** Orthogonal routing for architecture diagrams (default elbow). */
  readonly routing?: ConnectorRouting
}

export type WhiteboardElement =
  | StickyElement
  | TextElement
  | ShapeElement
  | StencilElement
  | PathElement
  | ConnectorElement

export type WhiteboardDocument = {
  readonly version: 1
  readonly elements: Readonly<Record<string, WhiteboardElement>>
}

export type WhiteboardCommand =
  | { readonly type: "setDocument"; readonly document: WhiteboardDocument }
  | { readonly type: "upsert"; readonly element: WhiteboardElement }
  | { readonly type: "upsertMany"; readonly elements: readonly WhiteboardElement[] }
  | { readonly type: "remove"; readonly ids: readonly string[] }
  | {
      readonly type: "patch"
      readonly id: string
      readonly patch: Partial<WhiteboardElement>
    }
  | {
      readonly type: "move"
      readonly ids: readonly string[]
      readonly dx: number
      readonly dy: number
    }

/** Shared stroke style for pen / highlighter / smart. */
export type DrawStrokeStyle = {
  readonly color: string
  readonly width: number
}

export const DEFAULT_PEN_STYLE: DrawStrokeStyle = {
  color: "#171717",
  width: 2,
}

export const DEFAULT_HIGHLIGHTER_STYLE: DrawStrokeStyle = {
  color: "#facc15",
  width: 16,
}

export const DRAW_COLOR_PRESETS = [
  "#171717",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#ca8a04",
  "#7c3aed",
  "#facc15",
  "#f472b6",
  "#ffffff",
] as const

export const DRAW_WIDTH_PRESETS = [1, 2, 4, 8, 12, 16, 24] as const

export type WhiteboardTemplateId =
  | "blank"
  | "system-design"
  | "2x2-matrix"
  | "flowchart"
  | "swot"
  | "user-journey"
  | "quick-retrospective"
  | "business-model-canvas"
  | "kanban"
  | "empathy-map"
  | "mind-map"

export type WhiteboardTemplate = {
  readonly id: WhiteboardTemplateId
  readonly titleKey: string
  readonly descriptionKey: string
  readonly document: WhiteboardDocument
}

export type ToolRailLabels = {
  readonly select: string
  readonly pan: string
  readonly pen: string
  readonly highlighter: string
  readonly smart: string
  readonly eraser: string
  readonly precisionEraser: string
  readonly lasso: string
  readonly sticky: string
  readonly text: string
  readonly shape: string
  readonly connector: string
}

export type DrawStyleBarLabels = {
  readonly color: string
  readonly thickness: string
}

export type WhiteboardChromeLabels = ToolRailLabels & {
  readonly undo: string
  readonly redo: string
  readonly delete: string
  readonly zoomIn: string
  readonly zoomOut: string
  readonly resetView: string
  readonly templates: string
  readonly prompt: string
  readonly applyTemplateConfirm: string
  readonly applyTemplateTitle: string
  readonly cancel: string
  readonly apply: string
}

/** Tools that show the color/thickness popover. */
export function isStrokeDrawTool(
  tool: WhiteboardTool
): tool is "pen" | "highlighter" | "smart" {
  return tool === "pen" || tool === "highlighter" || tool === "smart"
}

export function isEraserTool(
  tool: WhiteboardTool
): tool is "eraser" | "precisionEraser" {
  return tool === "eraser" || tool === "precisionEraser"
}

export function isDrawTool(tool: WhiteboardTool): tool is DrawTool {
  return (DRAW_TOOLS as readonly string[]).includes(tool)
}

/**
 * Tools safe for view-only sessions (navigate / inspect).
 * Edit tools stay available in the rail chrome only when `canEdit` is true.
 */
export function isViewSafeWhiteboardTool(tool: WhiteboardTool): boolean {
  return tool === "select" || tool === "pan"
}

export const SHAPE_MENU_ITEMS: readonly {
  kind: ShapeKind
  labelKey: string
  hotkey: string
}[] = [
  { kind: "line", labelKey: "shapes.line", hotkey: "L" },
  { kind: "arrow", labelKey: "shapes.arrow", hotkey: "" },
  { kind: "elbowArrow", labelKey: "shapes.elbowArrow", hotkey: "" },
  { kind: "blockArrow", labelKey: "shapes.blockArrow", hotkey: "" },
  { kind: "rect", labelKey: "shapes.rect", hotkey: "R" },
  { kind: "ellipse", labelKey: "shapes.oval", hotkey: "O" },
  { kind: "diamond", labelKey: "shapes.rhombus", hotkey: "" },
  { kind: "triangle", labelKey: "shapes.triangle", hotkey: "" },
  { kind: "divider", labelKey: "shapes.divider", hotkey: "" },
]
