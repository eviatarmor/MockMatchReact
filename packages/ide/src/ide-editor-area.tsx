import { Fragment, type ReactNode } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@mockmatch/ui/resizable"
import { cn } from "@mockmatch/ui/utils"

import {
  countLeaves,
  firstLeafId,
  type EditorGroupId,
  type EditorGroupState,
  type EditorLayoutNode,
} from "./editor-layout"
import { IdeTabs } from "./ide-tabs"
import { resolveTabLanguage } from "./language-from-filename"
import type { IdeCollabProps } from "./collab/types"
import { MonacoEditor } from "./monaco-editor"
import type {
  IdeLabels,
  IdeSettings,
  IdeSplitDirection,
  IdeTab,
  MonacoEditorOptions,
} from "./types"

export type {
  EditorGroupId,
  EditorGroupState,
  EditorLayoutBranch,
  EditorLayoutLeaf,
  EditorLayoutNode,
} from "./editor-layout"

/** @deprecated Two-pane split only — multi-pane uses EditorLayoutNode. */
export type EditorSplitState = {
  direction: IdeSplitDirection
} | null

export type IdeEditorAreaProps = {
  /** Document store (shared content across groups). */
  documents: IdeTab[]
  layout: EditorLayoutNode
  groups: Record<EditorGroupId, EditorGroupState>
  focusedPane: EditorGroupId
  onFocusPane: (pane: EditorGroupId) => void
  onGroupActiveChange: (pane: EditorGroupId, tabId: string) => void
  onGroupClose: (pane: EditorGroupId, tabId: string) => void
  onGroupCloseOthers: (pane: EditorGroupId, tabId: string) => void
  onGroupPin?: (tabId: string) => void
  onTabChange?: (tabId: string, value: string) => void
  onTabCopyPath?: (tabId: string) => void
  onTabCopyRelativePath?: (tabId: string) => void
  onTabReveal?: (tabId: string) => void
  onSplit?: (
    direction: IdeSplitDirection,
    tabId: string,
    sourceGroupId: EditorGroupId
  ) => void
  /** Close a specific editor group (defaults to focused if omitted). */
  onUnsplit?: (groupId?: EditorGroupId) => void
  showTerminal?: boolean
  onToggleTerminal?: () => void
  showAi?: boolean
  onToggleAi?: () => void
  fullscreen?: boolean
  onToggleFullscreen?: () => void
  theme: string
  settings: IdeSettings
  editorOptions?: MonacoEditorOptions
  emptyMessage?: string
  labels?: IdeLabels
  className?: string
  /** Optional multiplayer presence + Y bind (host owns room). */
  collab?: IdeCollabProps | null
}

function groupTabs(
  documents: IdeTab[],
  openTabIds: string[]
): IdeTab[] {
  const byId = new Map(documents.map((t) => [t.id, t]))
  return openTabIds
    .map((id) => byId.get(id))
    .filter((t): t is IdeTab => Boolean(t))
}

function EditorGroupPane({
  groupId,
  group,
  documents,
  focused,
  onFocus,
  onActiveChange,
  onClose,
  onCloseOthers,
  onPin,
  onTabChange,
  onTabCopyPath,
  onTabCopyRelativePath,
  onTabReveal,
  onSplit,
  onUnsplit,
  isSplit,
  showChrome,
  showTerminal,
  onToggleTerminal,
  showAi,
  onToggleAi,
  fullscreen,
  onToggleFullscreen,
  theme,
  settings,
  editorOptions,
  emptyMessage,
  labels,
  collab,
}: {
  groupId: EditorGroupId
  group: EditorGroupState
  documents: IdeTab[]
  focused: boolean
  onFocus: () => void
  onActiveChange: (tabId: string) => void
  onClose: (tabId: string) => void
  onCloseOthers: (tabId: string) => void
  onPin?: (tabId: string) => void
  onTabChange?: (tabId: string, value: string) => void
  onTabCopyPath?: (tabId: string) => void
  onTabCopyRelativePath?: (tabId: string) => void
  onTabReveal?: (tabId: string) => void
  onSplit?: (
    direction: IdeSplitDirection,
    tabId: string,
    sourceGroupId: EditorGroupId
  ) => void
  onUnsplit?: (groupId?: EditorGroupId) => void
  isSplit?: boolean
  showChrome?: boolean
  showTerminal?: boolean
  onToggleTerminal?: () => void
  showAi?: boolean
  onToggleAi?: () => void
  fullscreen?: boolean
  onToggleFullscreen?: () => void
  theme: string
  settings: IdeSettings
  editorOptions?: MonacoEditorOptions
  emptyMessage?: string
  labels?: IdeLabels
  collab?: IdeCollabProps | null
}) {
  const tabs = groupTabs(documents, group.openTabIds)
  const active =
    tabs.find((t) => t.id === group.activeTabId) ?? tabs[0]

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col",
        focused && isSplit && "ring-1 ring-inset ring-primary/40"
      )}
      onMouseDown={onFocus}
      data-slot="ide-editor-group"
      data-group={groupId}
    >
      <IdeTabs
        tabs={tabs}
        activeTabId={active?.id}
        onActiveTabChange={onActiveChange}
        onTabClose={onClose}
        onTabCloseOthers={onCloseOthers}
        onTabPin={onPin}
        onTabCopyPath={onTabCopyPath}
        onTabCopyRelativePath={onTabCopyRelativePath}
        onTabReveal={onTabReveal}
        onSplit={
          onSplit
            ? (dir, tabId) => onSplit(dir, tabId, groupId)
            : undefined
        }
        onUnsplit={onUnsplit ? () => onUnsplit(groupId) : undefined}
        isSplit={isSplit}
        showTerminal={showChrome ? showTerminal : undefined}
        onToggleTerminal={showChrome ? onToggleTerminal : undefined}
        showAi={showChrome ? showAi : undefined}
        onToggleAi={showChrome ? onToggleAi : undefined}
        fullscreen={showChrome ? fullscreen : undefined}
        onToggleFullscreen={showChrome ? onToggleFullscreen : undefined}
        labels={labels}
      />
      <div className="min-h-0 flex-1">
        {active ? (
          <MonacoEditor
            key={`${groupId}-${active.id}`}
            modelId={active.id}
            value={active.value}
            language={resolveTabLanguage(active)}
            theme={theme}
            settings={settings}
            options={editorOptions}
            onChange={(value) => {
              if (value !== undefined) onTabChange?.(active.id, value)
            }}
            collab={
              collab
                ? {
                    peers: collab.peers,
                    sendCursor: collab.sendCursor,
                    clearCursor: collab.clearCursor,
                    selfUserId: collab.selfUserId,
                    enabled: collab.enabled,
                    readOnly: collab.readOnly,
                    path: active.id,
                    yText: collab.getYText?.(active.id) ?? null,
                  }
                : null
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            {emptyMessage ?? "Open a file to start editing"}
          </div>
        )}
      </div>
    </div>
  )
}

function LayoutNodeView({
  node,
  documents,
  groups,
  focusedPane,
  isMulti,
  chromeGroupId,
  onFocusPane,
  onGroupActiveChange,
  onGroupClose,
  onGroupCloseOthers,
  onGroupPin,
  onTabChange,
  onTabCopyPath,
  onTabCopyRelativePath,
  onTabReveal,
  onSplit,
  onUnsplit,
  showTerminal,
  onToggleTerminal,
  showAi,
  onToggleAi,
  fullscreen,
  onToggleFullscreen,
  theme,
  settings,
  editorOptions,
  emptyMessage,
  labels,
  collab,
}: {
  node: EditorLayoutNode
  documents: IdeTab[]
  groups: Record<EditorGroupId, EditorGroupState>
  focusedPane: EditorGroupId
  isMulti: boolean
  chromeGroupId: EditorGroupId
  onFocusPane: (pane: EditorGroupId) => void
  onGroupActiveChange: (pane: EditorGroupId, tabId: string) => void
  onGroupClose: (pane: EditorGroupId, tabId: string) => void
  onGroupCloseOthers: (pane: EditorGroupId, tabId: string) => void
  onGroupPin?: (tabId: string) => void
  onTabChange?: (tabId: string, value: string) => void
  onTabCopyPath?: (tabId: string) => void
  onTabCopyRelativePath?: (tabId: string) => void
  onTabReveal?: (tabId: string) => void
  onSplit?: (
    direction: IdeSplitDirection,
    tabId: string,
    sourceGroupId: EditorGroupId
  ) => void
  onUnsplit?: (groupId?: EditorGroupId) => void
  showTerminal?: boolean
  onToggleTerminal?: () => void
  showAi?: boolean
  onToggleAi?: () => void
  fullscreen?: boolean
  onToggleFullscreen?: () => void
  theme: string
  settings: IdeSettings
  editorOptions?: MonacoEditorOptions
  emptyMessage?: string
  labels?: IdeLabels
  collab?: IdeCollabProps | null
}): ReactNode {
  if (node.type === "leaf") {
    const group = groups[node.groupId] ?? {
      openTabIds: [],
      activeTabId: undefined,
    }
    return (
      <EditorGroupPane
        groupId={node.groupId}
        group={group}
        documents={documents}
        focused={focusedPane === node.groupId}
        onFocus={() => onFocusPane(node.groupId)}
        onActiveChange={(id) => onGroupActiveChange(node.groupId, id)}
        onClose={(id) => onGroupClose(node.groupId, id)}
        onCloseOthers={(id) => onGroupCloseOthers(node.groupId, id)}
        onPin={onGroupPin}
        onTabChange={onTabChange}
        onTabCopyPath={onTabCopyPath}
        onTabCopyRelativePath={onTabCopyRelativePath}
        onTabReveal={onTabReveal}
        onSplit={onSplit}
        onUnsplit={onUnsplit}
        isSplit={isMulti}
        showChrome={node.groupId === chromeGroupId}
        showTerminal={showTerminal}
        onToggleTerminal={onToggleTerminal}
        showAi={showAi}
        onToggleAi={onToggleAi}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
        theme={theme}
        settings={settings}
        editorOptions={editorOptions}
        emptyMessage={emptyMessage}
        labels={labels}
        collab={collab}
      />
    )
  }

  const n = node.children.length
  const defaultSize = Math.floor(100 / n)

  return (
    <ResizablePanelGroup
      orientation={node.orientation}
      className="h-full min-h-0 min-w-0"
    >
      {node.children.map((child, i) => {
        const key =
          child.type === "leaf" ? child.groupId : child.id
        return (
          <Fragment key={key}>
            {i > 0 ? <ResizableHandle withHandle /> : null}
            <ResizablePanel
              defaultSize={
                i === n - 1 ? 100 - defaultSize * (n - 1) : defaultSize
              }
              minSize={12}
              className="min-h-0 min-w-0"
            >
              <LayoutNodeView
                node={child}
                documents={documents}
                groups={groups}
                focusedPane={focusedPane}
                isMulti={isMulti}
                chromeGroupId={chromeGroupId}
                onFocusPane={onFocusPane}
                onGroupActiveChange={onGroupActiveChange}
                onGroupClose={onGroupClose}
                onGroupCloseOthers={onGroupCloseOthers}
                onGroupPin={onGroupPin}
                onTabChange={onTabChange}
                onTabCopyPath={onTabCopyPath}
                onTabCopyRelativePath={onTabCopyRelativePath}
                onTabReveal={onTabReveal}
                onSplit={onSplit}
                onUnsplit={onUnsplit}
                showTerminal={showTerminal}
                onToggleTerminal={onToggleTerminal}
                showAi={showAi}
                onToggleAi={onToggleAi}
                fullscreen={fullscreen}
                onToggleFullscreen={onToggleFullscreen}
                theme={theme}
                settings={settings}
                editorOptions={editorOptions}
                emptyMessage={emptyMessage}
                labels={labels}
                collab={collab}
              />
            </ResizablePanel>
          </Fragment>
        )
      })}
    </ResizablePanelGroup>
  )
}

export function IdeEditorArea({
  documents,
  layout,
  groups,
  focusedPane,
  onFocusPane,
  onGroupActiveChange,
  onGroupClose,
  onGroupCloseOthers,
  onGroupPin,
  onTabChange,
  onTabCopyPath,
  onTabCopyRelativePath,
  onTabReveal,
  onSplit,
  onUnsplit,
  showTerminal,
  onToggleTerminal,
  showAi,
  onToggleAi,
  fullscreen,
  onToggleFullscreen,
  theme,
  settings,
  editorOptions,
  emptyMessage,
  labels,
  className,
  collab,
}: IdeEditorAreaProps) {
  const isMulti = countLeaves(layout) > 1
  const chromeGroupId = firstLeafId(layout)

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <LayoutNodeView
        node={layout}
        documents={documents}
        groups={groups}
        focusedPane={focusedPane}
        isMulti={isMulti}
        chromeGroupId={chromeGroupId}
        onFocusPane={onFocusPane}
        onGroupActiveChange={onGroupActiveChange}
        onGroupClose={onGroupClose}
        onGroupCloseOthers={onGroupCloseOthers}
        onGroupPin={onGroupPin}
        onTabChange={onTabChange}
        onTabCopyPath={onTabCopyPath}
        onTabCopyRelativePath={onTabCopyRelativePath}
        onTabReveal={onTabReveal}
        onSplit={onSplit}
        onUnsplit={onUnsplit}
        showTerminal={showTerminal}
        onToggleTerminal={onToggleTerminal}
        showAi={showAi}
        onToggleAi={onToggleAi}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
        theme={theme}
        settings={settings}
        editorOptions={editorOptions}
        emptyMessage={emptyMessage}
        labels={labels}
        collab={collab}
      />
    </div>
  )
}
