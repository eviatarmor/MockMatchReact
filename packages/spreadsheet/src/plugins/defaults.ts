import type { SpreadsheetPlugin } from "../plugin-system"
import { createCellEditPlugin } from "./cell-edit/plugin"
import { createClipboardPlugin } from "./clipboard/plugin"
import { createFormulaBarPlugin } from "./formula-bar/plugin"
import { createKeyboardPlugin } from "./keyboard/plugin"
import { createResizePlugin } from "./resize/plugin"
import { createSelectionPlugin } from "./selection/plugin"
import { createSheetTabsPlugin } from "./sheet-tabs/plugin"

/**
 * Full product plugin set: selection, keyboard, edit, resize, formula bar, tabs, clipboard.
 * Fresh instances each call (selection/resize drag state not shared).
 */
export function createDefaultPlugins(): SpreadsheetPlugin[] {
  return [
    createSelectionPlugin(),
    createKeyboardPlugin(),
    createCellEditPlugin(),
    createResizePlugin(),
    createFormulaBarPlugin(),
    createSheetTabsPlugin(),
    createClipboardPlugin(),
  ]
}
