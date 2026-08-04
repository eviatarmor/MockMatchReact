import type {
  PluginDoubleClickEvent,
  PluginSelectDoubleActivateEvent,
  WhiteboardPlugin,
  WhiteboardPluginContext,
} from "./types"
import { sortPlugins } from "./types"

export function runPluginKeyDown(
  plugins: readonly WhiteboardPlugin[],
  e: KeyboardEvent,
  ctx: WhiteboardPluginContext
): boolean {
  for (const plugin of sortPlugins(plugins)) {
    if (plugin.onKeyDown?.(e, ctx) === true) return true
  }
  return false
}

export function runPluginDoubleClick(
  plugins: readonly WhiteboardPlugin[],
  e: PluginDoubleClickEvent,
  ctx: WhiteboardPluginContext
): boolean {
  for (const plugin of sortPlugins(plugins)) {
    if (plugin.onDoubleClick?.(e, ctx) === true) return true
  }
  return false
}

export function runPluginSelectDoubleActivate(
  plugins: readonly WhiteboardPlugin[],
  e: PluginSelectDoubleActivateEvent,
  ctx: WhiteboardPluginContext
): boolean {
  for (const plugin of sortPlugins(plugins)) {
    if (plugin.onSelectDoubleActivate?.(e, ctx) === true) return true
  }
  return false
}
