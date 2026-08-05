import type { WhiteboardPlugin } from "../plugin-system"
import { createClipboardPlugin } from "./clipboard/plugin"
import { createConnectorPlugin } from "./connector/plugin"
import { createDrawPlugin } from "./draw/plugin"
import { createElementsPlugin } from "./elements/plugin"
import { createPanPlugin } from "./pan/plugin"
import { createSelectPlugin } from "./select/plugin"
import { createShapePlugin } from "./shape/plugin"
import { createShapeLabelPlugin } from "./shape-label/plugin"
import { createStickyPlugin } from "./sticky/plugin"
import { createTextPlugin } from "./text/plugin"
import { createTextEditPlugin } from "./text-edit/plugin"

/**
 * Full product plugin set: elements, tools, clipboard, label/text edit.
 * Fresh instances each call (clipboard state not shared).
 */
export function createDefaultPlugins(): WhiteboardPlugin[] {
  return [
    createElementsPlugin(),
    createSelectPlugin(),
    createPanPlugin(),
    createDrawPlugin(),
    createShapePlugin(),
    createStickyPlugin(),
    createTextPlugin(),
    createConnectorPlugin(),
    createClipboardPlugin(),
    createShapeLabelPlugin(),
    createTextEditPlugin(),
  ]
}

/** @deprecated Use createDefaultPlugins */
export function createDefaultBoardPlugins(): WhiteboardPlugin[] {
  return createDefaultPlugins()
}

/** @deprecated Use createDefaultPlugins */
export function createDefaultToolPlugins(): WhiteboardPlugin[] {
  return createDefaultPlugins()
}

/** @deprecated Use createDefaultPlugins */
export function createDefaultWhiteboardPlugins(): WhiteboardPlugin[] {
  return createDefaultPlugins()
}
