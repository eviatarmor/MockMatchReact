/** Board-space coordinates (not screen pixels). */

export type WhiteboardTool =
  | "select"
  | "pan"
  | "pen"
  | "sticky"
  | "text"
  | "shape"
  | "connector"

export type ShapeKind = "rect" | "ellipse" | "triangle" | "diamond"

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
  readonly label?: string
}

export type PathElement = {
  readonly id: string
  readonly type: "path"
  readonly points: readonly { readonly x: number; readonly y: number }[]
  readonly z: number
  readonly stroke: string
  readonly strokeWidth: number
}

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
}

export type WhiteboardElement =
  | StickyElement
  | TextElement
  | ShapeElement
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

export type WhiteboardTemplateId =
  | "blank"
  | "system-design"
  | "2x2-matrix"
  | "flowchart"
  | "swot"
  | "user-journey"

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
  readonly sticky: string
  readonly text: string
  readonly shape: string
  readonly connector: string
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
