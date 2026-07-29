import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@mockmatch/ui/utils"

import {
  IdeEditorArea,
  type EditorGroupId,
  type EditorGroupState,
  type EditorSplitState,
} from "./ide-editor-area"
import { FileTree } from "./file-tree"
import {
  isMonacoTarget,
  matchIdeKeybinding,
} from "./ide-keybindings"
import { IdeMenubar } from "./ide-menubar"
import { IdeTerminalPanel } from "./ide-terminal-panel"
import { TreeResizeHandle } from "./tree-resize-handle"
import type {
  FileTreeCreateRequest,
  IdeShellProps,
  IdeSplitDirection,
} from "./types"
import { resolveMonacoTheme, useColorScheme } from "./use-color-scheme"
import { useIdeSettings } from "./use-ide-settings"
import { useLeftPanelWidth } from "./use-left-panel-width"

const TREE_SPRING = { type: "spring" as const, stiffness: 320, damping: 34 }

function emptyGroup(): EditorGroupState {
  return { openTabIds: [], activeTabId: undefined }
}

function ensureOpen(
  group: EditorGroupState,
  tabId: string
): EditorGroupState {
  const openTabIds = group.openTabIds.includes(tabId)
    ? group.openTabIds
    : [...group.openTabIds, tabId]
  return { openTabIds, activeTabId: tabId }
}

function removeFromGroup(
  group: EditorGroupState,
  tabId: string
): EditorGroupState {
  const openTabIds = group.openTabIds.filter((id) => id !== tabId)
  let activeTabId = group.activeTabId
  if (activeTabId === tabId) {
    activeTabId = openTabIds[openTabIds.length - 1]
  }
  return { openTabIds, activeTabId }
}

export function IdeShell({
  tree,
  showTree: showTreeControlled,
  defaultShowTree,
  onShowTreeChange,
  treeToggleable,
  selectedTreeId,
  onTreeSelectionChange,
  defaultExpandedIds,
  onFilePreview,
  onFileOpen,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode,
  onCopyNode,
  onCutNode,
  onPasteNode,
  onDuplicateNode,
  canPaste,
  createRequest: createRequestProp,
  tabs,
  activeTabId,
  onActiveTabChange,
  onTabChange,
  onTabClose,
  onTabCloseOthers: _onTabCloseOthers,
  onTabPin,
  onTabCopyPath,
  onTabCopyRelativePath,
  onTabReveal,
  colorScheme = "auto",
  settings: settingsPartial,
  defaultSettings,
  onSettingsChange,
  treeDefaultWidth = 260,
  treeMinWidth = 180,
  treeMaxWidth = 480,
  treeWidthStorageKey = "mockmatch.ide.tree-width",
  className,
  treeHeader,
  editorEmpty,
  labels,
  editorOptions,
  fullscreen: fullscreenControlled,
  defaultFullscreen = false,
  onFullscreenChange,
  menubar,
  hideMenubar = false,
  showTerminal: showTerminalControlled,
  defaultShowTerminal = false,
  onShowTerminalChange,
  terminalDefaultHeight = 220,
  terminalMinHeight = 120,
  terminalMaxHeight = 480,
  terminalWelcome,
  terminalCwd,
  onTerminalCommand,
}: IdeShellProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const hasTree = Boolean(tree && tree.length > 0)
  const canToggleTree = hasTree && (treeToggleable ?? true)
  const [createRequestInternal, setCreateRequestInternal] =
    useState<FileTreeCreateRequest | null>(null)
  const [terminalFocusCwd, setTerminalFocusCwd] = useState<string | null>(null)

  const [primary, setPrimary] = useState<EditorGroupState>(emptyGroup)
  const [secondary, setSecondary] = useState<EditorGroupState | null>(null)
  const [split, setSplit] = useState<EditorSplitState>(null)
  const [focusedPane, setFocusedPane] = useState<EditorGroupId>("primary")

  const focusedRef = useRef(focusedPane)
  focusedRef.current = focusedPane

  const requestCreate = useCallback(
    (kind: "file" | "folder", parentId: string | null = null) => {
      setCreateRequestInternal({ kind, parentId, nonce: Date.now() })
    },
    []
  )

  const createRequest = createRequestProp ?? createRequestInternal

  const [showTreeInternal, setShowTreeInternal] = useState(() => {
    if (!hasTree) return false
    if (defaultShowTree !== undefined) return defaultShowTree
    return true
  })

  const showTree =
    hasTree &&
    (showTreeControlled !== undefined ? showTreeControlled : showTreeInternal)

  const setShowTree = useCallback(
    (next: boolean) => {
      if (showTreeControlled === undefined) {
        setShowTreeInternal(next)
      }
      onShowTreeChange?.(next)
    },
    [showTreeControlled, onShowTreeChange]
  )

  const [showTerminalInternal, setShowTerminalInternal] = useState(
    defaultShowTerminal
  )
  const showTerminal =
    showTerminalControlled !== undefined
      ? showTerminalControlled
      : showTerminalInternal

  const setShowTerminal = useCallback(
    (next: boolean) => {
      if (showTerminalControlled === undefined) {
        setShowTerminalInternal(next)
      }
      onShowTerminalChange?.(next)
    },
    [showTerminalControlled, onShowTerminalChange]
  )

  const [fullscreenInternal, setFullscreenInternal] = useState(defaultFullscreen)
  const fullscreen =
    fullscreenControlled !== undefined
      ? fullscreenControlled
      : fullscreenInternal

  const setFullscreen = useCallback(
    (next: boolean) => {
      if (fullscreenControlled === undefined) {
        setFullscreenInternal(next)
      }
      onFullscreenChange?.(next)
    },
    [fullscreenControlled, onFullscreenChange]
  )

  const { settings, patchSettings } = useIdeSettings({
    settings: settingsPartial,
    defaultSettings,
    onSettingsChange,
  })

  const { width: treeWidth, startResize, isDragging } = useLeftPanelWidth({
    defaultWidth: treeDefaultWidth,
    min: treeMinWidth,
    max: treeMaxWidth,
    storageKey: treeWidthStorageKey,
  })

  const resolvedScheme = useColorScheme(colorScheme)
  const monacoTheme = resolveMonacoTheme(settings.editorTheme, resolvedScheme)

  const termColorScheme =
    settings.editorTheme === "vs"
      ? "light"
      : settings.editorTheme === "vs-dark" ||
          settings.editorTheme === "hc-black"
        ? "dark"
        : resolvedScheme

  // Host opened/activated a document → ensure focused group has it.
  useEffect(() => {
    if (!activeTabId) return
    const pane = focusedRef.current
    if (pane === "secondary" && secondary) {
      setSecondary((g) => (g ? ensureOpen(g, activeTabId) : g))
    } else {
      setPrimary((g) => ensureOpen(g, activeTabId))
    }
  }, [activeTabId, secondary])

  // Prune group tabs when host removes documents.
  useEffect(() => {
    const ids = new Set(tabs.map((t) => t.id))
    setPrimary((g) => {
      const openTabIds = g.openTabIds.filter((id) => ids.has(id))
      if (openTabIds.length === g.openTabIds.length) return g
      let activeTabId = g.activeTabId
      if (activeTabId && !ids.has(activeTabId)) {
        activeTabId = openTabIds[openTabIds.length - 1]
      }
      return { openTabIds, activeTabId }
    })
    setSecondary((g) => {
      if (!g) return g
      const openTabIds = g.openTabIds.filter((id) => ids.has(id))
      if (openTabIds.length === g.openTabIds.length) return g
      let activeTabId = g.activeTabId
      if (activeTabId && !ids.has(activeTabId)) {
        activeTabId = openTabIds[openTabIds.length - 1]
      }
      return { openTabIds, activeTabId }
    })
  }, [tabs])

  // Seed primary from host tabs on first documents.
  useEffect(() => {
    if (primary.openTabIds.length > 0) return
    if (tabs.length === 0) return
    setPrimary({
      openTabIds: tabs.map((t) => t.id),
      activeTabId: activeTabId ?? tabs[0]?.id,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length])

  const handleGroupActiveChange = useCallback(
    (pane: EditorGroupId, tabId: string) => {
      setFocusedPane(pane)
      if (pane === "primary") {
        setPrimary((g) => ({ ...g, activeTabId: tabId }))
      } else {
        setSecondary((g) => (g ? { ...g, activeTabId: tabId } : g))
      }
      onActiveTabChange?.(tabId)
    },
    [onActiveTabChange]
  )

  const handleGroupClose = useCallback(
    (pane: EditorGroupId, tabId: string) => {
      const otherStillHas =
        pane === "primary"
          ? Boolean(secondary?.openTabIds.includes(tabId))
          : primary.openTabIds.includes(tabId)

      if (pane === "primary") {
        setPrimary((g) => removeFromGroup(g, tabId))
      } else {
        setSecondary((g) => (g ? removeFromGroup(g, tabId) : g))
      }
      // Drop document only if the other group is not still showing it.
      if (!otherStillHas) {
        onTabClose?.(tabId)
      }
    },
    [onTabClose, primary.openTabIds, secondary]
  )

  const handleGroupCloseOthers = useCallback(
    (pane: EditorGroupId, tabId: string) => {
      const pinned = new Set(tabs.filter((t) => t.pinned).map((t) => t.id))
      const keepIds = (ids: string[]) =>
        ids.filter((id) => id === tabId || pinned.has(id))

      const group = pane === "primary" ? primary : secondary
      if (!group) return

      const removed = group.openTabIds.filter(
        (id) => id !== tabId && !pinned.has(id)
      )

      if (pane === "primary") {
        setPrimary({
          openTabIds: keepIds(group.openTabIds),
          activeTabId: tabId,
        })
      } else {
        setSecondary({
          openTabIds: keepIds(group.openTabIds),
          activeTabId: tabId,
        })
      }

      // Drop host documents only if the other group is not still using them.
      for (const id of removed) {
        const otherHas =
          pane === "primary"
            ? Boolean(secondary?.openTabIds.includes(id))
            : primary.openTabIds.includes(id)
        if (!otherHas) onTabClose?.(id)
      }
    },
    [tabs, primary, secondary, onTabClose]
  )

  const handleSplit = useCallback(
    (direction: IdeSplitDirection, tabId: string) => {
      setSplit({ direction })
      setSecondary({ openTabIds: [tabId], activeTabId: tabId })
      setFocusedPane("secondary")
      // Ensure primary also has the tab if empty
      setPrimary((g) =>
        g.openTabIds.length === 0 ? ensureOpen(g, tabId) : g
      )
    },
    []
  )

  const handleUnsplit = useCallback(() => {
    setSecondary((sec) => {
      if (sec) {
        setPrimary((pri) => {
          const merged = [...pri.openTabIds]
          for (const id of sec.openTabIds) {
            if (!merged.includes(id)) merged.push(id)
          }
          return {
            openTabIds: merged,
            activeTabId: pri.activeTabId ?? sec.activeTabId,
          }
        })
      }
      return null
    })
    setSplit(null)
    setFocusedPane("primary")
  }, [])

  const openFolderInTerminal = useCallback(
    (nodeId: string) => {
      setTerminalFocusCwd(`~/${nodeId}`)
      setShowTerminal(true)
    },
    [setShowTerminal]
  )

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch {
      // blocked
    }
  }, [setFullscreen])

  useEffect(() => {
    const onFsChange = () => {
      setFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [setFullscreen])

  const focusedActiveId = useMemo(() => {
    if (focusedPane === "secondary" && secondary) {
      return secondary.activeTabId
    }
    return primary.activeTabId
  }, [focusedPane, primary.activeTabId, secondary])

  const cycleTab = useCallback(
    (direction: 1 | -1) => {
      const pane = focusedRef.current
      const group =
        pane === "secondary" && secondary ? secondary : primary
      const ids = group.openTabIds
      if (ids.length < 2) return
      const current = group.activeTabId ?? ids[0]
      const idx = Math.max(0, ids.indexOf(current ?? ""))
      const next = ids[(idx + direction + ids.length) % ids.length]
      if (!next) return
      handleGroupActiveChange(pane === "secondary" && secondary ? "secondary" : "primary", next)
    },
    [primary, secondary, handleGroupActiveChange]
  )

  // Keep latest action deps without re-binding the window listener every render
  const keyActionsRef = useRef({
    closeTab: () => {},
    toggleTerminal: () => {},
    toggleTree: () => {},
    toggleFullscreen: () => {},
    newFile: () => {},
    newFolder: () => {},
    splitRight: () => {},
    splitDown: () => {},
    nextTab: () => {},
    prevTab: () => {},
  })

  keyActionsRef.current = {
    closeTab: () => {
      const pane =
        focusedRef.current === "secondary" && secondary
          ? "secondary"
          : "primary"
      const group = pane === "secondary" && secondary ? secondary : primary
      const id = group.activeTabId
      if (!id) return
      const tab = tabs.find((t) => t.id === id)
      if (tab?.pinned) return
      handleGroupClose(pane, id)
    },
    toggleTerminal: () => setShowTerminal(!showTerminal),
    toggleTree: () => {
      if (!canToggleTree) return
      setShowTree(!showTree)
    },
    toggleFullscreen: () => {
      void toggleFullscreen()
    },
    newFile: () => {
      if (!onCreateFile) return
      requestCreate("file")
    },
    newFolder: () => {
      if (!onCreateFolder) return
      requestCreate("folder")
    },
    splitRight: () => {
      const id = focusedActiveId
      if (id) handleSplit("right", id)
    },
    splitDown: () => {
      const id = focusedActiveId
      if (id) handleSplit("down", id)
    },
    nextTab: () => cycleTab(1),
    prevTab: () => cycleTab(-1),
  }

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const onKeyDown = (e: KeyboardEvent) => {
      const ae = document.activeElement
      const focusInShell = ae instanceof Node && el.contains(ae)
      const targetInShell = e.target instanceof Node && el.contains(e.target)

      // Shell mounted → handle workbench keys even from host menubar.
      // Skip when typing in an external field outside the IDE.
      if (!focusInShell && !targetInShell && ae instanceof HTMLElement) {
        const tag = ae.tagName
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          ae.isContentEditable
        ) {
          return
        }
      }

      const match = matchIdeKeybinding(e)
      if (!match) return

      if (match.preventDefault) {
        e.preventDefault()
      }
      // Don't stopPropagation for browser-block / save — let xterm keep Ctrl+W word-delete
      if (match.action !== "blockBrowser" && match.action !== "save") {
        e.stopPropagation()
      }

      const actions = keyActionsRef.current
      switch (match.action) {
        case "closeTab":
          actions.closeTab()
          break
        case "toggleTerminal":
          actions.toggleTerminal()
          break
        case "toggleTree":
          actions.toggleTree()
          break
        case "toggleFullscreen":
          actions.toggleFullscreen()
          break
        case "newFile":
          actions.newFile()
          break
        case "newFolder":
          actions.newFolder()
          break
        case "splitRight":
          actions.splitRight()
          break
        case "splitDown":
          actions.splitDown()
          break
        case "nextTab":
          actions.nextTab()
          break
        case "prevTab":
          actions.prevTab()
          break
        case "save":
        case "blockBrowser":
          break
        default:
          break
      }
    }

    // Single window capture listener (avoids double-toggle with shell + window)
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [])

  const menubarNode =
    menubar ??
    (!hideMenubar ? (
      <IdeMenubar
        settings={settings}
        onPatchSettings={patchSettings}
        showTree={showTree}
        treeToggleable={canToggleTree}
        onToggleTree={
          canToggleTree ? () => setShowTree(!showTree) : undefined
        }
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        fullscreen={fullscreen}
        onToggleFullscreen={() => void toggleFullscreen()}
        onCreateFile={
          onCreateFile ? () => requestCreate("file") : undefined
        }
        onCreateFolder={
          onCreateFolder ? () => requestCreate("folder") : undefined
        }
        onSplit={(dir) => {
          const id = focusedActiveId
          if (id) handleSplit(dir, id)
        }}
        onUnsplit={split ? handleUnsplit : undefined}
        isSplit={Boolean(split)}
        labels={labels}
      />
    ) : null)

  const emptyMsg =
    typeof editorEmpty === "string"
      ? editorEmpty
      : labels?.emptyEditor

  /**
   * Browser menus off. Allow:
   * - Radix `ContextMenuTrigger` (tree / tabs / terminal tabs)
   * - Monaco editor (built-in editor menu)
   */
  const onContextMenuCapture = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const target = e.target
      if (
        target instanceof Element &&
        (target.closest('[data-slot="context-menu-trigger"]') ||
          isMonacoTarget(target))
      ) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
    },
    []
  )

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-background",
        className
      )}
      data-slot="ide-shell"
      data-fullscreen={fullscreen || undefined}
      tabIndex={-1}
      onContextMenuCapture={onContextMenuCapture}
    >
      {menubarNode ? (
        <div
          className="flex shrink-0 items-center gap-2 border-b border-border px-2 py-1"
          data-slot="ide-shell-menubar-row"
        >
          {menubarNode}
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {showTree && tree ? (
            <motion.aside
              key="ide-tree-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: treeWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={isDragging ? { duration: 0 } : TREE_SPRING}
              className="relative h-full shrink-0 overflow-hidden border-r border-border bg-muted/20"
            >
              <div
                className="relative flex h-full min-h-0 flex-col"
                style={{ width: treeWidth }}
              >
                {treeHeader}
                <div className="min-h-0 flex-1 overflow-hidden">
                  <FileTree
                    tree={tree}
                    selectedId={selectedTreeId}
                    onSelectionChange={onTreeSelectionChange}
                    defaultExpandedIds={defaultExpandedIds}
                    onFilePreview={onFilePreview}
                    onFileOpen={onFileOpen}
                    onCreateFile={onCreateFile}
                    onCreateFolder={onCreateFolder}
                    onDelete={onDeleteNode}
                    onRename={onRenameNode}
                    onCopy={onCopyNode}
                    onCut={onCutNode}
                    onPaste={onPasteNode}
                    onDuplicate={onDuplicateNode}
                    onOpenInTerminal={openFolderInTerminal}
                    canPaste={canPaste}
                    createRequest={createRequest}
                    labels={labels}
                  />
                </div>
                <TreeResizeHandle
                  onPointerDown={startResize}
                  label={labels?.resizeTree ?? "Resize file tree"}
                />
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <IdeEditorArea
            documents={tabs}
            primary={primary}
            secondary={secondary}
            split={split}
            focusedPane={focusedPane}
            onFocusPane={setFocusedPane}
            onGroupActiveChange={handleGroupActiveChange}
            onGroupClose={handleGroupClose}
            onGroupCloseOthers={handleGroupCloseOthers}
            onGroupPin={onTabPin}
            onTabChange={onTabChange}
            onTabCopyPath={onTabCopyPath}
            onTabCopyRelativePath={onTabCopyRelativePath}
            onTabReveal={onTabReveal}
            onSplit={handleSplit}
            onUnsplit={split ? handleUnsplit : undefined}
            showTerminal={showTerminal}
            onToggleTerminal={() => setShowTerminal(!showTerminal)}
            fullscreen={fullscreen}
            onToggleFullscreen={() => void toggleFullscreen()}
            theme={monacoTheme}
            settings={settings}
            editorOptions={editorOptions}
            emptyMessage={emptyMsg}
            labels={labels}
          />

          <IdeTerminalPanel
            open={showTerminal}
            onOpenChange={setShowTerminal}
            colorScheme={termColorScheme}
            labels={labels}
            welcome={terminalWelcome}
            defaultCwd={terminalCwd}
            defaultHeight={terminalDefaultHeight}
            minHeight={terminalMinHeight}
            maxHeight={terminalMaxHeight}
            onCommand={onTerminalCommand}
            focusCwd={terminalFocusCwd}
            onFocusCwdConsumed={() => setTerminalFocusCwd(null)}
          />
        </div>
      </div>
    </div>
  )
}

export type { IdeShellProps }
