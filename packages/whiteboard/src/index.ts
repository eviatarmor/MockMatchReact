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
  ShapeLabelEditorLabels,
  StencilElement,
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
  createStencil,
  createSticky,
  createText,
  connectorPolyline,
  elementBounds,
  stencilDisplaySize,
  hitTest,
  isBoardEmpty,
  lassoSelectIds,
  marqueeSelectIds,
  listElementsSorted,
  maxZ,
  newElementId,
  PASTE_OFFSET,
  preparePaste,
  remapDocumentIds,
  resolveConnectorPoint,
  sliceDocument,
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

export {
  STENCIL_CATEGORIES,
  STENCIL_INDEX,
  STENCIL_SHAPE_COUNT,
  getStencilCategory,
  loadStencilCategory,
  loadStencilDef,
  searchStencilIndex,
  type StencilCategoryFile,
  type StencilCategoryMeta,
  type StencilDef,
  type StencilIndexShape,
} from "./stencils/catalog"

export {
  STENCIL_LIBRARY_GROUPS,
  allLibraryPacks,
  categoryIdsForPack,
  categoryMatchesPack,
  findLibraryPack,
  type StencilLibraryGroup,
  type StencilLibraryPack,
} from "./stencils/library-groups"

export {
  WhiteboardStencilsPanel,
  type WhiteboardStencilsPanelLabels,
  type WhiteboardStencilsPanelProps,
} from "./stencils/library-panel"

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

export {
  FLOW_GRID,
  snapToGrid,
  snapPoint,
  elementPorts,
  nearestPort,
  elbowPolyline,
  applyResize,
  type ResizeHandle,
} from "./lib/flowchart"

// --- Plugin runtime ---
export type {
  BoardPointer,
  ElementTypeContribution,
  InteractionHost,
  PluginDoubleClickEvent,
  PluginRailContribution,
  PluginSelectDoubleActivateEvent,
  ToolDefinition,
  ToolGesture,
  ToolPrimaryButton,
  ToolRailApi,
  ToolSecondaryPanel,
  ViewportAccess,
  WhiteboardPlugin,
  WhiteboardPluginContext,
  WhiteboardToolPlugin,
} from "./plugin-system"

export {
  buildToolRegistry,
  collectElements,
  collectTools,
  pointerFromEvent,
  runPluginDoubleClick,
  runPluginKeyDown,
  runPluginSelectDoubleActivate,
  sortPlugins,
  sortRailPlugins,
  sortToolPlugins,
} from "./plugin-system"

// --- Plugins (single tree under src/plugins/) ---
export {
  createClipboardPlugin,
  createConnectorPlugin,
  createConnectorToolPlugin,
  createDefaultBoardPlugins,
  createDefaultPlugins,
  createDefaultToolPlugins,
  createDefaultWhiteboardPlugins,
  createDrawPlugin,
  createDrawToolPlugin,
  createElementsPlugin,
  createPanPlugin,
  createPanToolPlugin,
  createSelectPlugin,
  createSelectToolPlugin,
  createShapeLabelPlugin,
  createShapePlugin,
  createShapeToolPlugin,
  createStickyPlugin,
  createStickyToolPlugin,
  createTextEditPlugin,
  createTextPlugin,
  createTextToolPlugin,
  clipboardPlugin,
  shapeLabelPlugin,
  textEditPlugin,
} from "./plugins"
