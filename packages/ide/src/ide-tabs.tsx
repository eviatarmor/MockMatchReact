import {
  Columns2,
  FileCode2,
  FlaskConical,
  Loader2,
  Maximize2,
  Minimize2,
  Pin,
  Play,
  Rows2,
  Sparkles,
  SquareSplitHorizontal,
  TerminalSquare,
  X,
} from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@mockmatch/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mockmatch/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"

import type { IdeLabels, IdeSplitDirection, IdeTab } from "./types"

export type IdeTabsProps = {
  tabs: IdeTab[]
  activeTabId?: string
  onActiveTabChange?: (tabId: string) => void
  onTabClose?: (tabId: string) => void
  onTabCloseOthers?: (tabId: string) => void
  onTabPin?: (tabId: string) => void
  onTabCopyPath?: (tabId: string) => void
  onTabCopyRelativePath?: (tabId: string) => void
  onTabReveal?: (tabId: string) => void
  onSplit?: (direction: IdeSplitDirection, tabId: string) => void
  onUnsplit?: () => void
  isSplit?: boolean
  showTerminal?: boolean
  onToggleTerminal?: () => void
  showAi?: boolean
  onToggleAi?: () => void
  fullscreen?: boolean
  onToggleFullscreen?: () => void
  onRun?: () => void
  onRunTests?: () => void
  runBusy?: boolean
  runTestsBusy?: boolean
  runDisabled?: boolean
  runTestsDisabled?: boolean
  /** When false, host places Run chrome elsewhere. */
  showRunActions?: boolean
  /** When false, hide close UI (code-run single-file). Default true. */
  tabsClosable?: boolean
  labels?: IdeLabels
  className?: string
}

export function IdeTabs({
  tabs,
  activeTabId,
  onActiveTabChange,
  onTabClose,
  onTabCloseOthers,
  onTabPin,
  onTabCopyPath,
  onTabCopyRelativePath,
  onTabReveal,
  onSplit,
  onUnsplit,
  isSplit,
  showTerminal,
  onToggleTerminal,
  showAi,
  onToggleAi,
  fullscreen,
  onToggleFullscreen,
  onRun,
  onRunTests,
  runBusy = false,
  runTestsBusy = false,
  runDisabled = false,
  runTestsDisabled = false,
  showRunActions = true,
  tabsClosable = true,
  labels,
  className,
}: IdeTabsProps) {
  const value = activeTabId ?? tabs[0]?.id
  const hasRunActions =
    showRunActions && Boolean(onRun || onRunTests)
  const canClose = tabsClosable && Boolean(onTabClose)
  const canCloseOthers = tabsClosable && Boolean(onTabCloseOthers)

  const ordered = [
    ...tabs.filter((t) => t.pinned),
    ...tabs.filter((t) => !t.pinned),
  ]

  return (
    <TooltipProvider delay={300}>
    <div
      className={cn(
        "flex h-9 shrink-0 items-stretch border-b border-border",
        "bg-muted/60 dark:bg-muted/40",
        className
      )}
      data-slot="ide-tabs-bar"
    >
      <div
        role="tablist"
        aria-label="Open editors"
        className={cn(
          "flex min-w-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden",
          "[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]",
          "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-0",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
        )}
        data-slot="ide-tabs"
      >
        {ordered.map((tab) => {
          const active = tab.id === value
          return (
            <ContextMenu key={tab.id}>
              <ContextMenuTrigger
                className={cn(
                  "group/tab relative flex h-9 max-w-[14rem] min-w-[7.5rem] shrink-0 items-center border-r border-border/70",
                  active
                    ? "bg-background text-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
                onAuxClick={(e) => {
                  // Middle mouse → close (unless pinned / closable off)
                  if (e.button === 1 && canClose && onTabClose && !tab.pinned) {
                    e.preventDefault()
                    onTabClose(tab.id)
                  }
                }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => onActiveTabChange?.(tab.id)}
                  onDoubleClick={() => {
                    if (tab.preview || !tab.pinned) onTabPin?.(tab.id)
                  }}
                  className={cn(
                    "flex h-full min-w-0 flex-1 items-center gap-1.5 pl-3 pr-1 text-xs font-medium whitespace-nowrap",
                    "outline-none focus-visible:bg-background/80",
                    tab.preview && "italic font-normal"
                  )}
                >
                  {tab.pinned ? (
                    <Pin className="size-3 shrink-0 opacity-70" />
                  ) : (
                    <FileCode2 className="size-3.5 shrink-0 opacity-70" />
                  )}
                  <span className="min-w-0 truncate">
                    {tab.title}
                    {tab.dirty ? (
                      <span
                        className="ml-1 not-italic text-primary"
                        aria-hidden
                      >
                        •
                      </span>
                    ) : null}
                  </span>
                </button>
                {canClose && onTabClose && !tab.pinned ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          className={cn(
                            "mr-1 flex size-5 shrink-0 items-center justify-center rounded-sm",
                            "opacity-0 transition-opacity group-hover/tab:opacity-100",
                            "focus-visible:opacity-100",
                            active && "opacity-60 hover:opacity-100",
                            "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                          aria-label={labels?.close ?? `Close ${tab.title}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onTabClose(tab.id)
                          }}
                        />
                      }
                    >
                      <X className="size-3" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {labels?.close ?? "Close"}
                      <span className="ml-1.5 opacity-70">Ctrl+W</span>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
                {active ? (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                    aria-hidden
                  />
                ) : null}
              </ContextMenuTrigger>
              <ContextMenuContent className="min-w-48">
                {canClose && onTabClose && !tab.pinned ? (
                  <ContextMenuItem onClick={() => onTabClose(tab.id)}>
                    {labels?.close ?? "Close"}
                  </ContextMenuItem>
                ) : null}
                {canCloseOthers && onTabCloseOthers ? (
                  <ContextMenuItem onClick={() => onTabCloseOthers(tab.id)}>
                    {labels?.closeOthers ?? "Close Others"}
                  </ContextMenuItem>
                ) : null}
                {(canClose || canCloseOthers) &&
                (onTabCopyPath ||
                  onTabCopyRelativePath ||
                  onTabPin ||
                  onTabReveal ||
                  onSplit) ? (
                  <ContextMenuSeparator />
                ) : null}
                {onTabCopyPath ? (
                  <ContextMenuItem onClick={() => onTabCopyPath(tab.id)}>
                    {labels?.copyPath ?? "Copy Path"}
                  </ContextMenuItem>
                ) : null}
                {onTabCopyRelativePath ? (
                  <ContextMenuItem
                    onClick={() => onTabCopyRelativePath(tab.id)}
                  >
                    {labels?.copyRelativePath ?? "Copy Relative Path"}
                  </ContextMenuItem>
                ) : null}
                {onTabPin ? (
                  <ContextMenuItem onClick={() => onTabPin(tab.id)}>
                    {tab.pinned
                      ? (labels?.unpinTab ?? "Unpin Tab")
                      : (labels?.pinTab ?? "Pin Tab")}
                  </ContextMenuItem>
                ) : null}
                {onTabReveal ? (
                  <ContextMenuItem onClick={() => onTabReveal(tab.id)}>
                    {labels?.revealInExplorer ?? "Reveal in Project Panel"}
                  </ContextMenuItem>
                ) : null}
                {onSplit ? (
                  <>
                    <ContextMenuSeparator />
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>
                        {labels?.splitMenu ?? "Split"}
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent>
                        <ContextMenuItem
                          onClick={() => onSplit("right", tab.id)}
                        >
                          <Columns2 className="size-4" />
                          {labels?.splitRight ?? "Right"}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => onSplit("left", tab.id)}
                        >
                          <Columns2 className="size-4 rotate-180" />
                          {labels?.splitLeft ?? "Left"}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => onSplit("down", tab.id)}
                        >
                          <Rows2 className="size-4" />
                          {labels?.splitDown ?? "Down"}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onSplit("up", tab.id)}>
                          <Rows2 className="size-4 rotate-180" />
                          {labels?.splitUp ?? "Up"}
                        </ContextMenuItem>
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    {isSplit && onUnsplit ? (
                      <ContextMenuItem onClick={onUnsplit}>
                        {labels?.unsplit ?? "Close Split"}
                      </ContextMenuItem>
                    ) : null}
                  </>
                ) : null}
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 border-l border-border/70 px-1">
        {hasRunActions ? (
          <>
            {onRun ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs font-medium"
                      aria-label={labels?.run ?? "Run"}
                      disabled={runDisabled || runBusy}
                      onClick={onRun}
                    />
                  }
                >
                  {runBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5 fill-current" />
                  )}
                  <span className="hidden sm:inline">
                    {labels?.run ?? "Run"}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {labels?.run ?? "Run"}
                  <span className="ml-1.5 opacity-70">F5</span>
                </TooltipContent>
              </Tooltip>
            ) : null}
            {onRunTests ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs font-medium"
                      aria-label={labels?.runTests ?? "Run tests"}
                      disabled={runTestsDisabled || runTestsBusy}
                      onClick={onRunTests}
                    />
                  }
                >
                  {runTestsBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FlaskConical className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {labels?.runTests ?? "Run tests"}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {labels?.runTests ?? "Run tests"}
                  <span className="ml-1.5 opacity-70">Ctrl+Shift+Enter</span>
                </TooltipContent>
              </Tooltip>
            ) : null}
            <div
              className="mx-0.5 h-4 w-px shrink-0 bg-border"
              aria-hidden
            />
          </>
        ) : null}
        {onSplit ? (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant={isSplit ? "secondary" : "ghost"}
                        size="icon-xs"
                        aria-label={labels?.splitMenu ?? "Split editor"}
                        aria-pressed={isSplit}
                      />
                    }
                  />
                }
              >
                <SquareSplitHorizontal className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {labels?.splitMenu ?? "Split editor"}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem
                onClick={() => {
                  const id = value
                  if (id) onSplit("right", id)
                }}
              >
                <Columns2 className="size-4" />
                {labels?.splitRight ?? "Right"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const id = value
                  if (id) onSplit("left", id)
                }}
              >
                <Columns2 className="size-4 rotate-180" />
                {labels?.splitLeft ?? "Left"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const id = value
                  if (id) onSplit("down", id)
                }}
              >
                <Rows2 className="size-4" />
                {labels?.splitDown ?? "Down"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const id = value
                  if (id) onSplit("up", id)
                }}
              >
                <Rows2 className="size-4 rotate-180" />
                {labels?.splitUp ?? "Up"}
              </DropdownMenuItem>
              {isSplit && onUnsplit ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onUnsplit}>
                    {labels?.unsplit ?? "Close split"}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {onToggleTerminal ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant={showTerminal ? "secondary" : "ghost"}
                  size="icon-xs"
                  aria-label={labels?.toggleTerminal ?? "Toggle terminal"}
                  aria-pressed={showTerminal}
                  onClick={onToggleTerminal}
                />
              }
            >
              <TerminalSquare className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {labels?.toggleTerminal ?? "Terminal"}
            </TooltipContent>
          </Tooltip>
        ) : null}
        {onToggleAi ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant={showAi ? "secondary" : "ghost"}
                  size="icon-xs"
                  aria-label={labels?.toggleAi ?? "Toggle AI assistant"}
                  aria-pressed={showAi}
                  onClick={onToggleAi}
                />
              }
            >
              <Sparkles className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {labels?.toggleAi ?? "AI Assistant"}
              <span className="ml-1.5 opacity-70">Ctrl+L</span>
            </TooltipContent>
          </Tooltip>
        ) : null}
        {onToggleFullscreen ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant={fullscreen ? "secondary" : "ghost"}
                  size="icon-xs"
                  aria-label={
                    fullscreen
                      ? (labels?.exitFullscreen ?? "Exit full screen")
                      : (labels?.fullscreen ?? "Full screen")
                  }
                  aria-pressed={fullscreen}
                  onClick={onToggleFullscreen}
                />
              }
            >
              {fullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {fullscreen
                ? (labels?.exitFullscreen ?? "Exit Full Screen")
                : (labels?.fullscreen ?? "Full Screen")}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
    </TooltipProvider>
  )
}
