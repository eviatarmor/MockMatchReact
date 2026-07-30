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

import { IdeAiPanel } from "./ide-ai-panel"
import { IdeEditorArea } from "./ide-editor-area"
import {
  anyOtherGroupHasTab,
  collectGroupIds,
  countLeaves,
  createRootLayout,
  emptyGroup,
  ensureOpen,
  firstLeafId,
  pickNeighborGroupId,
  removeFromGroup,
  removeGroupFromLayout,
  splitLayout,
  type EditorGroupId,
  type EditorGroupState,
  type EditorLayoutNode,
} from "./editor-layout"
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
const ROOT_GROUP_ID: EditorGroupId = "g0"

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
  terminalPty = null,
  terminalPtyFeed = null,
  aiPanel,
  showAi: showAiControlled,
  defaultShowAi = false,
  onShowAiChange,
  aiDefaultWidth = 360,
  aiMinWidth = 280,
  aiMaxWidth = 560,
  aiWidthStorageKey = "mockmatch.ide.ai-width",
  collab,
  onRun,
  onRunTests,
  runBusy = false,
  runTestsBusy = false,
  runDisabled = false,
  runTestsDisabled = false,
  runActionsPlacement = "tabs",
  terminalFeed = null,
}: IdeShellProps) {
  const showRunChrome = runActionsPlacement !== "none"
  const rootRef = useRef<HTMLDivElement>(null)
  const hasTree = Boolean(tree && tree.length > 0)
  const canToggleTree = hasTree && (treeToggleable ?? true)
  const [createRequestInternal, setCreateRequestInternal] =
    useState<FileTreeCreateRequest | null>(null)
  const [terminalFocusCwd, setTerminalFocusCwd] = useState<string | null>(null)

  const idSeq = useRef(1)
  const mintGroupId = useCallback((): EditorGroupId => {
    return `g${idSeq.current++}`
  }, [])
  const mintBranchId = useCallback((): string => {
    return `b${idSeq.current++}`
  }, [])

  const [layout, setLayout] = useState<EditorLayoutNode>(() =>
    createRootLayout(ROOT_GROUP_ID)
  )
  const [groups, setGroups] = useState<Record<EditorGroupId, EditorGroupState>>(
    () => ({ [ROOT_GROUP_ID]: emptyGroup() })
  )
  const [focusedPane, setFocusedPane] =
    useState<EditorGroupId>(ROOT_GROUP_ID)

  const focusedRef = useRef(focusedPane)
  focusedRef.current = focusedPane
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const groupsRef = useRef(groups)
  groupsRef.current = groups

  const isMultiPane = countLeaves(layout) > 1

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

  // Open bottom terminal when host pushes sandbox / runner output
  useEffect(() => {
    if (terminalFeed) setShowTerminal(true)
  }, [terminalFeed, setShowTerminal])

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

  const hasAiPanel = aiPanel != null
  const [showAiInternal, setShowAiInternal] = useState(defaultShowAi)
  const showAi =
    hasAiPanel &&
    (showAiControlled !== undefined ? showAiControlled : showAiInternal)

  const setShowAi = useCallback(
    (next: boolean) => {
      if (!hasAiPanel) return
      if (showAiControlled === undefined) {
        setShowAiInternal(next)
      }
      onShowAiChange?.(next)
    },
    [hasAiPanel, showAiControlled, onShowAiChange]
  )

  const closeAi = useCallback(() => setShowAi(false), [setShowAi])

  const aiPanelNode = useMemo(() => {
    if (!aiPanel) return null
    if (typeof aiPanel === "function") {
      return aiPanel({ close: closeAi })
    }
    return aiPanel
  }, [aiPanel, closeAi])

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

  // Host opened/activated a document → open only in the focused group.
  useEffect(() => {
    if (!activeTabId) return
    const pane = focusedRef.current
    setGroups((prev) => {
      const g = prev[pane] ?? emptyGroup()
      const next = ensureOpen(g, activeTabId)
      if (
        next.openTabIds === g.openTabIds &&
        next.activeTabId === g.activeTabId
      ) {
        return prev
      }
      return { ...prev, [pane]: next }
    })
  }, [activeTabId])

  // Prune group tabs when host removes documents.
  useEffect(() => {
    const ids = new Set(tabs.map((t) => t.id))
    setGroups((prev) => {
      let changed = false
      const next: Record<EditorGroupId, EditorGroupState> = {}
      for (const [gid, g] of Object.entries(prev)) {
        const openTabIds = g.openTabIds.filter((id) => ids.has(id))
        if (openTabIds.length !== g.openTabIds.length) {
          changed = true
          let active = g.activeTabId
          if (active && !ids.has(active)) {
            active = openTabIds[openTabIds.length - 1]
          }
          next[gid] = { openTabIds, activeTabId: active }
        } else {
          next[gid] = g
        }
      }
      return changed ? next : prev
    })
  }, [tabs])

  // Seed root group from host tabs on first documents.
  useEffect(() => {
    setGroups((prev) => {
      const root = prev[ROOT_GROUP_ID]
      if (!root || root.openTabIds.length > 0) return prev
      if (tabs.length === 0) return prev
      return {
        ...prev,
        [ROOT_GROUP_ID]: {
          openTabIds: tabs.map((t) => t.id),
          activeTabId: activeTabId ?? tabs[0]?.id,
        },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length])

  const closePane = useCallback(
    (pane: EditorGroupId, absorbTabs: boolean) => {
      const currentLayout = layoutRef.current
      if (countLeaves(currentLayout) <= 1) return

      const neighbor =
        pickNeighborGroupId(currentLayout, pane) ??
        collectGroupIds(currentLayout).find((id) => id !== pane)

      setGroups((prev) => {
        const dying = prev[pane]
        const next = { ...prev }
        delete next[pane]
        if (absorbTabs && dying && neighbor && next[neighbor]) {
          const openTabIds = [...next[neighbor].openTabIds]
          for (const id of dying.openTabIds) {
            if (!openTabIds.includes(id)) openTabIds.push(id)
          }
          next[neighbor] = {
            ...next[neighbor],
            openTabIds,
          }
        }
        return next
      })

      setLayout((prev) => removeGroupFromLayout(prev, pane) ?? prev)
      setFocusedPane((cur) => {
        if (cur !== pane) return cur
        return neighbor ?? firstLeafId(layoutRef.current)
      })
    },
    []
  )

  const handleGroupActiveChange = useCallback(
    (pane: EditorGroupId, tabId: string) => {
      setFocusedPane(pane)
      setGroups((prev) => {
        const g = prev[pane]
        if (!g) return prev
        return { ...prev, [pane]: { ...g, activeTabId: tabId } }
      })
      onActiveTabChange?.(tabId)
    },
    [onActiveTabChange]
  )

  const handleGroupClose = useCallback(
    (pane: EditorGroupId, tabId: string) => {
      const snapshot = groupsRef.current
      const otherStillHas = anyOtherGroupHasTab(snapshot, tabId, pane)

      setGroups((prev) => {
        const g = prev[pane]
        if (!g) return prev
        const nextG = removeFromGroup(g, tabId)
        return { ...prev, [pane]: nextG }
      })

      // Empty multi-pane group → drop the pane.
      const gAfter = removeFromGroup(snapshot[pane] ?? emptyGroup(), tabId)
      if (
        gAfter.openTabIds.length === 0 &&
        countLeaves(layoutRef.current) > 1
      ) {
        closePane(pane, false)
      }

      if (!otherStillHas) {
        onTabClose?.(tabId)
      }
    },
    [onTabClose, closePane]
  )

  const handleGroupCloseOthers = useCallback(
    (pane: EditorGroupId, tabId: string) => {
      const pinned = new Set(tabs.filter((t) => t.pinned).map((t) => t.id))
      const group = groupsRef.current[pane]
      if (!group) return

      const removed = group.openTabIds.filter(
        (id) => id !== tabId && !pinned.has(id)
      )

      setGroups((prev) => {
        const g = prev[pane]
        if (!g) return prev
        return {
          ...prev,
          [pane]: {
            openTabIds: g.openTabIds.filter(
              (id) => id === tabId || pinned.has(id)
            ),
            activeTabId: tabId,
          },
        }
      })

      for (const id of removed) {
        if (!anyOtherGroupHasTab(groupsRef.current, id, pane)) {
          onTabClose?.(id)
        }
      }
    },
    [tabs, onTabClose]
  )

  const handleSplit = useCallback(
    (
      direction: IdeSplitDirection,
      tabId: string,
      sourceGroupId?: EditorGroupId
    ) => {
      const sourceId = sourceGroupId ?? focusedRef.current
      const newId = mintGroupId()
      const branchId = mintBranchId()

      setGroups((prev) => {
        const source = prev[sourceId] ?? emptyGroup()
        return {
          ...prev,
          [sourceId]:
            source.openTabIds.length === 0
              ? ensureOpen(source, tabId)
              : source,
          [newId]: { openTabIds: [tabId], activeTabId: tabId },
        }
      })
      setLayout((prev) =>
        splitLayout(prev, sourceId, direction, newId, branchId)
      )
      focusedRef.current = newId
      setFocusedPane(newId)
    },
    [mintGroupId, mintBranchId]
  )

  /** Close an editor group (defaults to focused). Tabs merge into a neighbor. */
  const handleUnsplit = useCallback(
    (groupId?: EditorGroupId) => {
      const pane = groupId ?? focusedRef.current
      if (countLeaves(layoutRef.current) <= 1) return
      closePane(pane, true)
    },
    [closePane]
  )

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
    return groups[focusedPane]?.activeTabId
  }, [focusedPane, groups])

  const cycleTab = useCallback(
    (direction: 1 | -1) => {
      const pane = focusedRef.current
      const group = groupsRef.current[pane]
      if (!group) return
      const ids = group.openTabIds
      if (ids.length < 2) return
      const current = group.activeTabId ?? ids[0]
      const idx = Math.max(0, ids.indexOf(current ?? ""))
      const next = ids[(idx + direction + ids.length) % ids.length]
      if (!next) return
      handleGroupActiveChange(pane, next)
    },
    [handleGroupActiveChange]
  )

  // Keep latest action deps without re-binding the window listener every render
  const keyActionsRef = useRef({
    closeTab: () => {},
    toggleTerminal: () => {},
    toggleTree: () => {},
    toggleAi: () => {},
    toggleFullscreen: () => {},
    newFile: () => {},
    newFolder: () => {},
    splitRight: () => {},
    splitDown: () => {},
    nextTab: () => {},
    prevTab: () => {},
    run: () => {},
    runTests: () => {},
    hasRun: false,
    hasRunTests: false,
  })

  keyActionsRef.current = {
    closeTab: () => {
      const pane = focusedRef.current
      const group = groupsRef.current[pane]
      const id = group?.activeTabId
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
    toggleAi: () => {
      if (!hasAiPanel) return
      setShowAi(!showAi)
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
    run: () => {
      if (!onRun || runDisabled || runBusy) return
      onRun()
    },
    runTests: () => {
      if (!onRunTests || runTestsDisabled || runTestsBusy) return
      onRunTests()
    },
    hasRun: Boolean(onRun),
    hasRunTests: Boolean(onRunTests),
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
      // Don't capture F5 / Ctrl+Enter when host never wired sandbox actions.
      if (match.action === "run" && !keyActionsRef.current.hasRun) return
      if (match.action === "runTests" && !keyActionsRef.current.hasRunTests) {
        return
      }

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
        case "toggleAi":
          actions.toggleAi()
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
        case "run":
          actions.run()
          break
        case "runTests":
          actions.runTests()
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
        showAi={showAi}
        onToggleAi={
          hasAiPanel ? () => setShowAi(!showAi) : undefined
        }
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
        onUnsplit={isMultiPane ? handleUnsplit : undefined}
        isSplit={isMultiPane}
        onRun={showRunChrome ? onRun : undefined}
        onRunTests={showRunChrome ? onRunTests : undefined}
        runBusy={runBusy}
        runTestsBusy={runTestsBusy}
        runDisabled={runDisabled}
        runTestsDisabled={runTestsDisabled}
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
            layout={layout}
            groups={groups}
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
            onUnsplit={isMultiPane ? handleUnsplit : undefined}
            showTerminal={showTerminal}
            onToggleTerminal={() => setShowTerminal(!showTerminal)}
            showAi={showAi}
            onToggleAi={
              hasAiPanel ? () => setShowAi(!showAi) : undefined
            }
            fullscreen={fullscreen}
            onToggleFullscreen={() => void toggleFullscreen()}
            onRun={showRunChrome ? onRun : undefined}
            onRunTests={showRunChrome ? onRunTests : undefined}
            runBusy={runBusy}
            runTestsBusy={runTestsBusy}
            runDisabled={runDisabled}
            runTestsDisabled={runTestsDisabled}
            theme={monacoTheme}
            settings={settings}
            editorOptions={editorOptions}
            emptyMessage={emptyMsg}
            labels={labels}
            collab={collab}
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
            feed={terminalFeed}
            pty={terminalPty}
            ptyFeed={terminalPtyFeed}
          />
        </div>

        {hasAiPanel ? (
          <IdeAiPanel
            open={showAi}
            colorScheme={termColorScheme}
            defaultWidth={aiDefaultWidth}
            minWidth={aiMinWidth}
            maxWidth={aiMaxWidth}
            widthStorageKey={aiWidthStorageKey}
            resizeLabel={labels?.resizeAi ?? "Resize AI panel"}
          >
            {aiPanelNode}
          </IdeAiPanel>
        ) : null}
      </div>
    </div>
  )
}

export type { IdeShellProps }
