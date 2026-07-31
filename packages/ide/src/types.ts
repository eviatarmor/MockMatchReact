import type { editor } from "monaco-editor"
import type { ReactNode } from "react"

import type { IdeCollabProps } from "./collab/types"

/** File-tree node. Folders have `children`; files are leaves. */
export type IdeTreeNode = {
  id: string
  name: string
  children?: IdeTreeNode[]
}

export type FileTreeCreateKind = "file" | "folder"

export type FileTreeCreateRequest = {
  kind: FileTreeCreateKind
  parentId: string | null
  /** Change this to re-trigger a draft (e.g. Date.now()). */
  nonce: number
}

export type IdeTab = {
  id: string
  title: string
  language?: string
  value: string
  dirty?: boolean
  /**
   * VS Code-style preview tab (single-click). Italic in tab bar;
   * replaced by the next preview unless double-clicked / edited.
   */
  preview?: boolean
  /** Pinned tabs stay leftmost and skip close-others by default. */
  pinned?: boolean
}

export type IdeTerminalSession = {
  id: string
  title: string
  cwd?: string
  pinned?: boolean
}

/** Editor split direction relative to the focused group. */
export type IdeSplitDirection = "left" | "right" | "up" | "down"

/** Monaco theme pick. `auto` follows app light/dark. */
export type IdeEditorTheme = "auto" | "vs" | "vs-dark" | "hc-black"

export type IdeSettings = {
  editorTheme: IdeEditorTheme
  ligatures: boolean
  wordWrap: "off" | "on" | "wordWrapColumn" | "bounded"
  minimap: boolean
  lineNumbers: "on" | "off" | "relative"
  fontSize: number
  tabSize: number
  renderWhitespace: "none" | "boundary" | "selection" | "trailing" | "all"
  bracketPairColorization: boolean
  smoothScrolling: boolean
  fontFamily?: string
}

export type IdeColorScheme = "light" | "dark" | "auto"

export type IdeLabels = {
  toggleTree?: string
  toggleTerminal?: string
  ligatures?: string
  wordWrap?: string
  minimap?: string
  lineNumbers?: string
  fontSize?: string
  tabSize?: string
  whitespace?: string
  bracketColors?: string
  emptyEditor?: string
  fullscreen?: string
  exitFullscreen?: string
  toggleAi?: string
  resizeAi?: string
  newFile?: string
  newFolder?: string
  delete?: string
  rename?: string
  cut?: string
  copy?: string
  paste?: string
  duplicate?: string
  close?: string
  closeOthers?: string
  copyPath?: string
  copyRelativePath?: string
  pinTab?: string
  unpinTab?: string
  revealInExplorer?: string
  openInTerminal?: string
  viewMenu?: string
  editorMenu?: string
  fileMenu?: string
  themeMenu?: string
  themeAuto?: string
  themeLight?: string
  themeDark?: string
  themeHighContrast?: string
  resizeTree?: string
  resizeTerminal?: string
  terminalTitle?: string
  newTerminal?: string
  closeTerminal?: string
  splitRight?: string
  splitLeft?: string
  splitUp?: string
  splitDown?: string
  unsplit?: string
  splitMenu?: string
  copied?: string
  /** Run active code via host-provided runner. */
  run?: string
  /** Run tests via host-provided runner. */
  runTests?: string
  runMenu?: string
}

/** Host chat content for the IDE AI panel (product-agnostic slot). */
export type IdeAiPanelContent =
  | ReactNode
  | ((api: { close: () => void }) => ReactNode)

export const DEFAULT_IDE_SETTINGS: IdeSettings = {
  editorTheme: "auto",
  ligatures: true,
  wordWrap: "on",
  minimap: false,
  lineNumbers: "on",
  fontSize: 14,
  tabSize: 2,
  renderWhitespace: "selection",
  bracketPairColorization: true,
  smoothScrolling: true,
}

export const LIGATURE_FONT_FAMILY =
  "Cascadia Code, Fira Code, JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"

export const DEFAULT_FONT_FAMILY =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"

export type MonacoEditorOptions = editor.IStandaloneEditorConstructionOptions

export type IdeShellProps = {
  tree?: IdeTreeNode[]
  showTree?: boolean
  defaultShowTree?: boolean
  onShowTreeChange?: (show: boolean) => void
  treeToggleable?: boolean
  selectedTreeId?: string
  onTreeSelectionChange?: (selectedIds: string[]) => void
  defaultExpandedIds?: string[]
  onFilePreview?: (nodeId: string) => void
  onFileOpen?: (nodeId: string) => void
  onCreateFile?: (parentId: string | null, name: string) => boolean | void
  onCreateFolder?: (parentId: string | null, name: string) => boolean | void
  onDeleteNode?: (nodeId: string) => void
  onRenameNode?: (nodeId: string, name: string) => boolean | void
  onCopyNode?: (nodeId: string) => void
  onCutNode?: (nodeId: string) => void
  onPasteNode?: (parentId: string | null) => void
  onDuplicateNode?: (nodeId: string) => void
  canPaste?: boolean
  createRequest?: FileTreeCreateRequest | null

  tabs: IdeTab[]
  activeTabId?: string
  onActiveTabChange?: (tabId: string) => void
  onTabChange?: (tabId: string, value: string) => void
  onTabClose?: (tabId: string) => void
  onTabCloseOthers?: (tabId: string) => void
  onTabPin?: (tabId: string) => void
  onTabCopyPath?: (tabId: string) => void
  onTabCopyRelativePath?: (tabId: string) => void
  onTabReveal?: (tabId: string) => void
  /**
   * When false, hide close chrome and ignore close shortcuts / middle-click.
   * Default true. Use for single-file code-run exercises.
   */
  tabsClosable?: boolean

  colorScheme?: IdeColorScheme
  settings?: Partial<IdeSettings>
  defaultSettings?: Partial<IdeSettings>
  onSettingsChange?: (settings: IdeSettings) => void

  treeDefaultWidth?: number
  treeMinWidth?: number
  treeMaxWidth?: number
  treeWidthStorageKey?: string

  className?: string
  treeHeader?: ReactNode
  editorEmpty?: ReactNode
  labels?: IdeLabels
  editorOptions?: MonacoEditorOptions
  fullscreen?: boolean
  defaultFullscreen?: boolean
  onFullscreenChange?: (fullscreen: boolean) => void
  menubar?: ReactNode
  hideMenubar?: boolean

  showTerminal?: boolean
  defaultShowTerminal?: boolean
  onShowTerminalChange?: (show: boolean) => void
  terminalDefaultHeight?: number
  terminalMinHeight?: number
  terminalMaxHeight?: number
  terminalWelcome?: string
  terminalCwd?: string
  onTerminalCommand?: (
    command: string,
    sessionId: string
  ) => string | string[] | void | Promise<string | string[] | void>
  /**
   * SSH-like PTY bridge. When `pty.active`, the terminal sends raw keystrokes
   * and writes `terminalPtyFeed` (host owns remote PTY transport).
   */
  terminalPty?: {
    active: boolean
    onData: (data: string) => void
    onResize?: (cols: number, rows: number) => void
  } | null
  terminalPtyFeed?: { seq: number; chunk: string } | null

  /**
   * Right AI assistant panel content. When provided, a toggle appears
   * next to full screen on the tab bar (and in View menu).
   * Host owns transport / i18n / product chat (e.g. `@mockmatch/ai-chat`).
   */
  aiPanel?: IdeAiPanelContent
  showAi?: boolean
  defaultShowAi?: boolean
  onShowAiChange?: (show: boolean) => void
  aiDefaultWidth?: number
  aiMinWidth?: number
  aiMaxWidth?: number
  aiWidthStorageKey?: string

  /**
   * Optional multiplayer collaboration.
   * Host owns useCollabRoom + Y.Doc; package wires Monaco presence + Y.Text.
   */
  collab?: IdeCollabProps | null

  /**
   * Host run actions. When set, Run / Run tests appear on the tab bar
   * (and Run menu) unless `runActionsPlacement` is `"none"`.
   * Package owns chrome only — host owns docker/gVisor/judge (often via WS).
   */
  onRun?: () => void
  onRunTests?: () => void
  /** Disable Run while a job is in flight. */
  runBusy?: boolean
  /** Disable Run tests while a test job is in flight. */
  runTestsBusy?: boolean
  runDisabled?: boolean
  runTestsDisabled?: boolean
  /**
   * Where to render Run chrome.
   * - `"tabs"` (default) — tab bar + menubar
   * - `"none"` — host renders its own buttons; shortcuts still work
   */
  runActionsPlacement?: "tabs" | "none"
  /**
   * Push text into the active terminal (e.g. runner stdout from the host).
   * Bump `seq` for each chunk so the same text can repeat.
   */
  terminalFeed?: { seq: number; chunk: string } | null
}
