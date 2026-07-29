/**
 * Product-agnostic IDE shell: optional file tree, animated sidebar, Monaco, tabs, menubar.
 * Host supplies tree/tabs data, theme, and labels.
 */

export { IdeShell } from "./ide-shell"
export { FileTree, type FileTreeProps } from "./file-tree"
export { MonacoEditor, type MonacoEditorProps } from "./monaco-editor"
export {
  acquireMonacoModel,
  releaseMonacoModel,
  disposeMonacoModel,
} from "./monaco-models"
export { IdeMenubar, type IdeMenubarProps } from "./ide-menubar"
export { IdeTabs, type IdeTabsProps } from "./ide-tabs"
export { IdeTerminal, type IdeTerminalProps } from "./ide-terminal"
export {
  IdeTerminalPanel,
  type IdeTerminalPanelProps,
} from "./ide-terminal-panel"
export {
  IdeEditorArea,
  type IdeEditorAreaProps,
  type EditorSplitState,
  type EditorGroupState,
  type EditorGroupId,
  type EditorLayoutNode,
  type EditorLayoutLeaf,
  type EditorLayoutBranch,
} from "./ide-editor-area"
export {
  useIdeSettings,
  type UseIdeSettingsOptions,
  type UseIdeSettingsReturn,
} from "./use-ide-settings"
export {
  useColorScheme,
  monacoThemeForScheme,
  resolveMonacoTheme,
  type ResolvedColorScheme,
} from "./use-color-scheme"
export {
  DEFAULT_IDE_SETTINGS,
  DEFAULT_FONT_FAMILY,
  LIGATURE_FONT_FAMILY,
  type IdeTreeNode,
  type IdeTab,
  type IdeSettings,
  type IdeEditorTheme,
  type IdeColorScheme,
  type IdeLabels,
  type IdeShellProps,
  type MonacoEditorOptions,
  type FileTreeCreateKind,
  type FileTreeCreateRequest,
  type IdeTerminalSession,
  type IdeSplitDirection,
} from "./types"
export {
  matchIdeKeybinding,
  isIdeTerminalTarget,
  isMonacoTarget,
  type IdeKeyAction,
  type IdeKeyMatch,
} from "./ide-keybindings"
export {
  languageFromFileName,
  resolveTabLanguage,
} from "./language-from-filename"
