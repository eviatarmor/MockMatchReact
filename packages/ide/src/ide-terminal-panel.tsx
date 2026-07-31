import { useCallback, useEffect, useRef, useState } from "react"
import { Pin, Plus, TerminalSquare, X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@mockmatch/ui/context-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"

import { IdeTerminal } from "./ide-terminal"
import { TerminalResizeHandle } from "./terminal-resize-handle"
import type { IdeLabels, IdeTerminalSession } from "./types"
import type { ResolvedColorScheme } from "./use-color-scheme"
import { useBottomPanelHeight } from "./use-bottom-panel-height"

export type IdeTerminalPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  colorScheme: ResolvedColorScheme
  labels?: IdeLabels
  welcome?: string
  defaultCwd?: string
  defaultHeight?: number
  minHeight?: number
  maxHeight?: number
  onCommand?: (
    command: string,
    sessionId: string
  ) => string | string[] | void | Promise<string | string[] | void>
  focusCwd?: string | null
  onFocusCwdConsumed?: () => void
  /** Push into the active terminal session (host runner feed). */
  feed?: { seq: number; chunk: string } | null
  /** SSH-like PTY (raw keys + remote echo). */
  pty?: {
    active: boolean
    onData: (data: string) => void
    onResize?: (cols: number, rows: number) => void
  } | null
  ptyFeed?: { seq: number; chunk: string } | null
  /**
   * - `dock` (default): bottom panel with resize + collapse
   * - `fill`: full-height terminal lab (multi-tab add/remove, no collapse)
   */
  layout?: "dock" | "fill"
  className?: string
}

let termSeq = 1

function newSession(cwd?: string): IdeTerminalSession {
  const n = termSeq++
  return {
    id: `term-${n}`,
    title: `Terminal ${n}`,
    cwd,
    pinned: false,
  }
}

export function IdeTerminalPanel({
  open,
  onOpenChange,
  colorScheme,
  labels,
  welcome,
  defaultCwd = "~/workspace",
  defaultHeight = 220,
  minHeight = 120,
  maxHeight = 480,
  onCommand,
  focusCwd,
  onFocusCwdConsumed,
  feed,
  pty = null,
  ptyFeed = null,
  layout = "dock",
  className,
}: IdeTerminalPanelProps) {
  const fill = layout === "fill"
  const [sessions, setSessions] = useState<IdeTerminalSession[]>(() => [
    newSession(defaultCwd),
  ])
  const [activeId, setActiveId] = useState(() => sessions[0]!.id)

  /** Stay mounted after first open so collapse/expand don't recreate xterm. */
  const [everOpened, setEverOpened] = useState(open || fill)
  /** Defer xterm body one frame so height animation can paint first. */
  const [bodyReady, setBodyReady] = useState(false)
  /**
   * Host Run output may arrive before xterm mounts (2 rAF defer).
   * Buffer chunks and flush as a synthetic feed once body is ready.
   */
  const pendingFeedRef = useRef("")
  const lastSeenFeedSeq = useRef(0)
  const [flushFeed, setFlushFeed] = useState<{
    seq: number
    chunk: string
  } | null>(null)
  const flushSeqRef = useRef(0)

  const { height, startResize } = useBottomPanelHeight({
    defaultHeight,
    min: minHeight,
    max: maxHeight,
    storageKey: "mockmatch.ide.terminal-height",
  })

  useEffect(() => {
    if (open || fill) setEverOpened(true)
  }, [open, fill])

  useEffect(() => {
    if ((!open && !fill) || bodyReady) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setBodyReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [open, fill, bodyReady])

  // Accumulate feed while xterm not ready; pass through when ready
  useEffect(() => {
    if (!feed || feed.seq === lastSeenFeedSeq.current) return
    lastSeenFeedSeq.current = feed.seq
    if (!bodyReady) {
      pendingFeedRef.current += feed.chunk
      return
    }
    // If we had backlog, prepend once
    if (pendingFeedRef.current) {
      const backlog = pendingFeedRef.current
      pendingFeedRef.current = ""
      flushSeqRef.current += 1
      setFlushFeed({
        seq: flushSeqRef.current,
        chunk: backlog + feed.chunk,
      })
      return
    }
    flushSeqRef.current += 1
    setFlushFeed({ seq: flushSeqRef.current, chunk: feed.chunk })
  }, [feed, bodyReady])

  // Drain backlog when body becomes ready with no new feed event
  useEffect(() => {
    if (!bodyReady || !pendingFeedRef.current) return
    const backlog = pendingFeedRef.current
    pendingFeedRef.current = ""
    flushSeqRef.current += 1
    setFlushFeed({ seq: flushSeqRef.current, chunk: backlog })
  }, [bodyReady])

  useEffect(() => {
    if (!focusCwd) return
    const session = newSession(focusCwd)
    setSessions((prev) => [...prev, session])
    setActiveId(session.id)
    onOpenChange(true)
    onFocusCwdConsumed?.()
  }, [focusCwd, onFocusCwdConsumed, onOpenChange])

  const addSession = useCallback(() => {
    const session = newSession(defaultCwd)
    setSessions((prev) => [...prev, session])
    setActiveId(session.id)
  }, [defaultCwd])

  const closeSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const target = prev.find((s) => s.id === id)
        if (target?.pinned) return prev
        if (prev.length <= 1) {
          // Fill mode: keep at least one tab. Dock: collapse panel.
          if (fill) return prev
          onOpenChange(false)
          return prev
        }
        const next = prev.filter((s) => s.id !== id)
        setActiveId((cur) => {
          if (cur !== id) return cur
          return next[next.length - 1]?.id ?? cur
        })
        return next
      })
    },
    [onOpenChange, fill]
  )

  const closeOthers = useCallback((id: string) => {
    setSessions((prev) => {
      const keep = prev.filter((s) => s.id === id || s.pinned)
      setActiveId(id)
      return keep
    })
  }, [])

  const togglePin = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    )
  }, [])

  const ordered = [
    ...sessions.filter((s) => s.pinned),
    ...sessions.filter((s) => !s.pinned),
  ]

  if (!everOpened) return null

  const tabBar = (
    <TooltipProvider delay={300}>
      <div
        className={cn(
          "flex shrink-0 items-stretch border-b border-border",
          fill
            ? "h-9 bg-muted/60 dark:bg-muted/40"
            : "h-8 items-center gap-0.5 border-border/60 px-1"
        )}
        data-slot="ide-terminal-tabs"
      >
        <div
          role="tablist"
          aria-label="Terminals"
          className={cn(
            "flex min-w-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden",
            fill
              ? "[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]"
              : "items-center gap-0.5"
          )}
        >
          {ordered.map((s) => {
            const active = s.id === activeId
            return (
              <ContextMenu key={s.id}>
                <ContextMenuTrigger
                  className={cn(
                    "group/ttab relative flex shrink-0 items-center",
                    fill
                      ? cn(
                          "h-9 max-w-[14rem] min-w-[7.5rem] border-r border-border/70",
                          active
                            ? "bg-background text-foreground"
                            : "bg-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground"
                        )
                      : cn(
                          "h-7 max-w-[10rem] gap-1 rounded-md px-2 text-xs",
                          active
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )
                  )}
                  onAuxClick={(e) => {
                    if (e.button === 1 && !s.pinned) {
                      e.preventDefault()
                      closeSession(s.id)
                    }
                  }}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 outline-none",
                      fill
                        ? "h-full flex-1 pl-3 pr-1 text-xs font-medium whitespace-nowrap"
                        : ""
                    )}
                    onClick={() => setActiveId(s.id)}
                  >
                    {s.pinned ? (
                      <Pin className="size-3 shrink-0 opacity-70" />
                    ) : (
                      <TerminalSquare className="size-3.5 shrink-0 opacity-70" />
                    )}
                    <span className="min-w-0 truncate">{s.title}</span>
                  </button>
                  {!s.pinned ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            className={cn(
                              "flex shrink-0 items-center justify-center rounded-sm",
                              fill
                                ? cn(
                                    "mr-1 size-5 opacity-0 transition-opacity group-hover/ttab:opacity-100",
                                    "focus-visible:opacity-100 hover:bg-muted",
                                    active && "opacity-60 hover:opacity-100"
                                  )
                                : cn(
                                    "size-4 opacity-0 group-hover/ttab:opacity-100 hover:bg-background",
                                    active && "opacity-60"
                                  )
                            )}
                            aria-label={
                              labels?.closeTerminal ?? "Close terminal"
                            }
                            onClick={(e) => {
                              e.stopPropagation()
                              closeSession(s.id)
                            }}
                          />
                        }
                      >
                        <X className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {labels?.closeTerminal ?? "Close terminal"}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                  {fill && active ? (
                    <span
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </ContextMenuTrigger>
                <ContextMenuContent className="min-w-40">
                  {!s.pinned ? (
                    <ContextMenuItem onClick={() => closeSession(s.id)}>
                      {labels?.close ?? "Close"}
                    </ContextMenuItem>
                  ) : null}
                  <ContextMenuItem onClick={() => closeOthers(s.id)}>
                    {labels?.closeOthers ?? "Close Others"}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => togglePin(s.id)}>
                    {s.pinned
                      ? (labels?.unpinTab ?? "Unpin")
                      : (labels?.pinTab ?? "Pin")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )
          })}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 px-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={labels?.newTerminal ?? "New terminal"}
                  onClick={addSession}
                />
              }
            >
              <Plus className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {labels?.newTerminal ?? "New terminal"}
            </TooltipContent>
          </Tooltip>
          {!fill ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={labels?.toggleTerminal ?? "Hide terminal"}
                    onClick={() => onOpenChange(false)}
                  />
                }
              >
                <X className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {labels?.toggleTerminal ?? "Hide terminal"}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  )

  const termBodies = (
    <div
      className="relative min-h-0 flex-1"
      style={fill ? undefined : { height: Math.max(0, height - 32) }}
    >
      {bodyReady
        ? sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "absolute inset-0",
                s.id === activeId ? "visible z-10" : "invisible z-0"
              )}
              aria-hidden={s.id !== activeId}
            >
              <IdeTerminal
                colorScheme={colorScheme}
                welcome={welcome}
                cwd={s.cwd ?? defaultCwd}
                onCommand={
                  onCommand ? (cmd) => onCommand(cmd, s.id) : undefined
                }
                feed={s.id === activeId ? flushFeed : null}
                pty={s.id === activeId ? pty : null}
                ptyFeed={s.id === activeId ? ptyFeed : null}
              />
            </div>
          ))
        : null}
    </div>
  )

  if (fill) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 w-full flex-col overflow-hidden bg-background",
          className
        )}
        data-slot="ide-terminal-panel"
        data-layout="fill"
      >
        {tabBar}
        {termBodies}
      </div>
    )
  }

  // CSS height transition; Monaco/xterm layout debounced until settle.
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border-t border-border bg-background",
        "transition-[height] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        !open && "pointer-events-none border-t-transparent",
        className
      )}
      style={{ height: open ? height : 0 }}
      data-slot="ide-terminal-panel"
      data-layout="dock"
      aria-hidden={!open}
    >
      <div className="relative flex min-h-0 flex-col" style={{ height }}>
        <TerminalResizeHandle
          onPointerDown={startResize}
          label={labels?.resizeTerminal ?? "Resize terminal"}
        />
        {tabBar}
        {termBodies}
      </div>
    </div>
  )
}
