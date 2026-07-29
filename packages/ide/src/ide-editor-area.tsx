import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@mockmatch/ui/resizable"
import { cn } from "@mockmatch/ui/utils"

import { IdeTabs } from "./ide-tabs"
import { resolveTabLanguage } from "./language-from-filename"
import { MonacoEditor } from "./monaco-editor"
import type {
  IdeLabels,
  IdeSettings,
  IdeSplitDirection,
  IdeTab,
  MonacoEditorOptions,
} from "./types"

export type EditorGroupId = "primary" | "secondary"

export type EditorGroupState = {
  openTabIds: string[]
  activeTabId?: string
}

export type EditorSplitState = {
  direction: IdeSplitDirection
} | null

export type IdeEditorAreaProps = {
  /** Document store (shared content across groups). */
  documents: IdeTab[]
  primary: EditorGroupState
  secondary: EditorGroupState | null
  split: EditorSplitState
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
  onSplit?: (direction: IdeSplitDirection, tabId: string) => void
  onUnsplit?: () => void
  showTerminal?: boolean
  onToggleTerminal?: () => void
  fullscreen?: boolean
  onToggleFullscreen?: () => void
  theme: string
  settings: IdeSettings
  editorOptions?: MonacoEditorOptions
  emptyMessage?: string
  labels?: IdeLabels
  className?: string
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
  fullscreen,
  onToggleFullscreen,
  theme,
  settings,
  editorOptions,
  emptyMessage,
  labels,
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
  onSplit?: (direction: IdeSplitDirection, tabId: string) => void
  onUnsplit?: () => void
  isSplit?: boolean
  showChrome?: boolean
  showTerminal?: boolean
  onToggleTerminal?: () => void
  fullscreen?: boolean
  onToggleFullscreen?: () => void
  theme: string
  settings: IdeSettings
  editorOptions?: MonacoEditorOptions
  emptyMessage?: string
  labels?: IdeLabels
}) {
  const tabs = groupTabs(documents, group.openTabIds)
  const active =
    tabs.find((t) => t.id === group.activeTabId) ?? tabs[0]

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col",
        // Focus ring only when split — single pane / empty editor stays clean
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
        onSplit={onSplit}
        onUnsplit={onUnsplit}
        isSplit={isSplit}
        showTerminal={showChrome ? showTerminal : undefined}
        onToggleTerminal={showChrome ? onToggleTerminal : undefined}
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

export function IdeEditorArea({
  documents,
  primary,
  secondary,
  split,
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
  fullscreen,
  onToggleFullscreen,
  theme,
  settings,
  editorOptions,
  emptyMessage,
  labels,
  className,
}: IdeEditorAreaProps) {
  const primaryPane = (
    <EditorGroupPane
      groupId="primary"
      group={primary}
      documents={documents}
      focused={focusedPane === "primary"}
      onFocus={() => onFocusPane("primary")}
      onActiveChange={(id) => onGroupActiveChange("primary", id)}
      onClose={(id) => onGroupClose("primary", id)}
      onCloseOthers={(id) => onGroupCloseOthers("primary", id)}
      onPin={onGroupPin}
      onTabChange={onTabChange}
      onTabCopyPath={onTabCopyPath}
      onTabCopyRelativePath={onTabCopyRelativePath}
      onTabReveal={onTabReveal}
      onSplit={onSplit}
      onUnsplit={onUnsplit}
      isSplit={Boolean(split)}
      showChrome
      showTerminal={showTerminal}
      onToggleTerminal={onToggleTerminal}
      fullscreen={fullscreen}
      onToggleFullscreen={onToggleFullscreen}
      theme={theme}
      settings={settings}
      editorOptions={editorOptions}
      emptyMessage={emptyMessage}
      labels={labels}
    />
  )

  if (!split || !secondary) {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        {primaryPane}
      </div>
    )
  }

  const horizontal =
    split.direction === "left" || split.direction === "right"
  const primaryFirst =
    split.direction === "right" || split.direction === "down"

  const secondaryPane = (
    <EditorGroupPane
      groupId="secondary"
      group={secondary}
      documents={documents}
      focused={focusedPane === "secondary"}
      onFocus={() => onFocusPane("secondary")}
      onActiveChange={(id) => onGroupActiveChange("secondary", id)}
      onClose={(id) => onGroupClose("secondary", id)}
      onCloseOthers={(id) => onGroupCloseOthers("secondary", id)}
      onPin={onGroupPin}
      onTabChange={onTabChange}
      onTabCopyPath={onTabCopyPath}
      onTabCopyRelativePath={onTabCopyRelativePath}
      onTabReveal={onTabReveal}
      onSplit={onSplit}
      onUnsplit={onUnsplit}
      isSplit
      showChrome={false}
      theme={theme}
      settings={settings}
      editorOptions={editorOptions}
      emptyMessage={emptyMessage}
      labels={labels}
    />
  )

  const a = (
    <ResizablePanel defaultSize={50} minSize={20} className="min-h-0 min-w-0">
      {primaryFirst ? primaryPane : secondaryPane}
    </ResizablePanel>
  )
  const b = (
    <ResizablePanel defaultSize={50} minSize={20} className="min-h-0 min-w-0">
      {primaryFirst ? secondaryPane : primaryPane}
    </ResizablePanel>
  )

  return (
    <div className={cn("min-h-0 flex-1", className)}>
      <ResizablePanelGroup
        orientation={horizontal ? "horizontal" : "vertical"}
        className="h-full"
      >
        {a}
        <ResizableHandle withHandle />
        {b}
      </ResizablePanelGroup>
    </div>
  )
}
