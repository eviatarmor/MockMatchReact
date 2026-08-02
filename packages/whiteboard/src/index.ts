/**
 * Product-agnostic infinite whiteboard shell.
 * Host supplies persistence, collab, i18n labels, and practice chrome.
 */

export type {
  ConnectorAnchor,
  ConnectorElement,
  ConnectorEnd,
  DrawStrokeStyle,
  DrawStyleBarLabels,
  PathElement,
  PathStrokeKind,
  ShapeElement,
  ShapeKind,
  StickyElement,
  TextElement,
  ToolRailLabels,
  WhiteboardChromeLabels,
  WhiteboardCommand,
  WhiteboardDocument,
  WhiteboardElement,
  WhiteboardTemplate,
  WhiteboardTemplateId,
  WhiteboardTool,
} from "./types"

export {
  DEFAULT_HIGHLIGHTER_STYLE,
  DEFAULT_PEN_STYLE,
  DRAW_COLOR_PRESETS,
  DRAW_WIDTH_PRESETS,
  isEraserTool,
  isStrokeDrawTool,
} from "./types"

export {
  applyCommand,
  cloneDocument,
  createConnector,
  createEmptyBoard,
  createPath,
  createShape,
  createSticky,
  createText,
  elementBounds,
  hitTest,
  isBoardEmpty,
  lassoSelectIds,
  listElementsSorted,
  maxZ,
  newElementId,
  remapDocumentIds,
  resolveConnectorPoint,
} from "./document"

export { createHistory, type WhiteboardHistory } from "./history"

export {
  WHITEBOARD_ZOOM,
  useWhiteboardViewport,
  type WhiteboardViewport,
} from "./viewport"

export {
  WhiteboardCanvas,
  type WhiteboardCanvasProps,
} from "./canvas/whiteboard-canvas"

export {
  WhiteboardShell,
  type WhiteboardShellProps,
} from "./shell/whiteboard-shell"

export {
  WhiteboardBottomBar,
  type WhiteboardBottomBarLabels,
  type WhiteboardBottomBarProps,
} from "./bottom-bar"

export {
  WhiteboardToolRail,
  toolFromHotkey,
  shapeKindFromHotkey,
  type WhiteboardToolRailProps,
  type WhiteboardToolRailLabels,
} from "./tool-rail"

export {
  WhiteboardDrawStyleBar,
  type WhiteboardDrawStyleBarProps,
} from "./draw-style-bar"

export {
  DRAW_TOOLS,
  SHAPE_MENU_ITEMS,
  STICKY_COLOR_PRESETS,
  isDrawTool,
  type DrawTool,
} from "./types"

export {
  WHITEBOARD_TEMPLATES,
  applyTemplateDocument,
  getWhiteboardTemplate,
} from "./templates/catalog"

export {
  WhiteboardTemplatesPanel,
  type WhiteboardTemplatesPanelLabels,
  type WhiteboardTemplatesPanelProps,
} from "./templates/templates-panel"

export { exportBoardPng } from "./export-png"

export {
  classifySmartStroke,
  simplifyRdp,
  pointInPolygon,
  distToSegment,
} from "./lib/geometry"

export {
  eraseWholeStrokesAt,
  precisionEraseAt,
  pathHitsBrush,
  erasePathPoints,
} from "./lib/erase"
