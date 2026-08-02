/**
 * Product-agnostic infinite whiteboard shell.
 * Host supplies persistence, collab, i18n labels, and practice chrome.
 */

export type {
  ConnectorAnchor,
  ConnectorElement,
  ConnectorEnd,
  PathElement,
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
  type WhiteboardToolRailProps,
} from "./tool-rail"

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
