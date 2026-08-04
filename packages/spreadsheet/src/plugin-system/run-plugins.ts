import type {
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
  SpreadsheetPointerDownEvent,
  SpreadsheetPointerMoveEvent,
  SpreadsheetPointerUpEvent,
} from "./types"
import { sortPlugins } from "./types"

export function runPluginKeyDown(
  plugins: readonly SpreadsheetPlugin[],
  e: KeyboardEvent,
  ctx: SpreadsheetPluginContext
): boolean {
  for (const plugin of sortPlugins(plugins)) {
    if (plugin.onKeyDown?.(e, ctx) === true) return true
  }
  return false
}

export function runPluginPointerDown(
  plugins: readonly SpreadsheetPlugin[],
  e: SpreadsheetPointerDownEvent,
  ctx: SpreadsheetPluginContext
): boolean {
  for (const plugin of sortPlugins(plugins)) {
    if (plugin.onPointerDown?.(e, ctx) === true) return true
  }
  return false
}

export function runPluginPointerMove(
  plugins: readonly SpreadsheetPlugin[],
  e: SpreadsheetPointerMoveEvent,
  ctx: SpreadsheetPluginContext
): boolean {
  for (const plugin of sortPlugins(plugins)) {
    if (plugin.onPointerMove?.(e, ctx) === true) return true
  }
  return false
}

export function runPluginPointerUp(
  plugins: readonly SpreadsheetPlugin[],
  e: SpreadsheetPointerUpEvent,
  ctx: SpreadsheetPluginContext
): boolean {
  for (const plugin of sortPlugins(plugins)) {
    if (plugin.onPointerUp?.(e, ctx) === true) return true
  }
  return false
}
