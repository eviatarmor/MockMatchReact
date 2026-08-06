/**
 * Product-agnostic freeform page editor (Lexical playground–style surface).
 * Host supplies chrome, labels, save, and collab room.
 */

export { PageShell, type PageShellProps } from "./page-shell"
export { PageEditor, type PageEditorProps } from "./page-editor"
export { PAGE_EDITOR_NODES } from "./nodes"
export { pageEditorTheme } from "./theme"
export type {
  BlockType,
  PageEditorLabels,
  PageShellLabels,
  SlashItem,
  SlashItemId,
} from "./types"
