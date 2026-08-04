import type { SpreadsheetPlugin } from "../plugin-system"
import { createCellEditPlugin } from "./cell-edit/plugin"
import { createClipboardPlugin } from "./clipboard/plugin"
import { createFillPlugin } from "./fill/plugin"
import { createFormatPlugin } from "./format/plugin"
import { createFormulaBarPlugin } from "./formula-bar/plugin"
import { createHistoryPlugin } from "./history/plugin"
import { createKeyboardPlugin } from "./keyboard/plugin"
import { createResizePlugin } from "./resize/plugin"
import { createSelectionPlugin } from "./selection/plugin"
import { createSheetTabsPlugin } from "./sheet-tabs/plugin"

/**
 * Full product plugin set.
 * Fresh instances each call (selection/resize/fill drag state not shared).
 */
export function createDefaultPlugins(): SpreadsheetPlugin[] {
  return [
    createHistoryPlugin(),
    createSelectionPlugin(),
    createFillPlugin(),
    createKeyboardPlugin(),
    createCellEditPlugin(),
    createResizePlugin(),
    createFormulaBarPlugin(),
    createSheetTabsPlugin(),
    createFormatPlugin(),
    createClipboardPlugin(),
  ]
}
