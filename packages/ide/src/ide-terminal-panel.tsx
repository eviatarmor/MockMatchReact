import { useCallback, useEffect, useState } from "react"
import { motion } from "motion/react"
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
  /** Push into the active terminal session (sandbox WS feed). */
  feed?: { seq: number; chunk: string } | null
  /** SSH-like PTY (raw keys + remote echo). */
  pty?: {
    active: boolean
    onData: (data: string) => void
    onResize?: (cols: number, rows: number) => void
  } | null
  ptyFeed?: { seq: number; chunk: string } | null
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

/** Height ease — spring + xterm mount on open was nuking INP / expand frames. */
const TERM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

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
}: IdeTerminalPanelProps) {
  const [sessions, setSessions] = useState<IdeTerminalSession[]>(() => [
    newSession(defaultCwd),
  ])
  const [activeId, setActiveId] = useState(() => sessions[0]!.id)

  /** Stay mounted after first open so collapse/expand don't recreate xterm. */
  const [everOpened, setEverOpened] = useState(open)
  /** Defer xterm body one frame so height animation can paint first. */
  const [bodyReady, setBodyReady] = useState(false)

  const { height, startResize, isDragging } = useBottomPanelHeight({
    defaultHeight,
    min: minHeight,
    max: maxHeight,
    storageKey: "mockmatch.ide.terminal-height",
  })

  useEffect(() => {
    if (open) setEverOpened(true)
  }, [open])

  useEffect(() => {
    if (!open || bodyReady) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setBodyReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [open, bodyReady])

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
    [onOpenChange]
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

  return (
    <motion.div
      initial={false}
      animate={{
        height: open ? height : 0,
        opacity: open ? 1 : 0,
      }}
      transition={
        isDragging
          ? { duration: 0 }
          : {
              height: { duration: 0.22, ease: TERM_EASE },
              opacity: { duration: 0.16, ease: "easeOut" },
            }
      }
      className={cn(
        "relative shrink-0 overflow-hidden border-t border-border bg-background",
        !open && "pointer-events-none border-t-transparent"
      )}
      data-slot="ide-terminal-panel"
      aria-hidden={!open}
    >
      {/* Fixed inner height so open animation clips content; xterm not recreated */}
      <div
        className="relative flex min-h-0 flex-col"
        style={{ height }}
      >
        <TerminalResizeHandle
          onPointerDown={startResize}
          label={labels?.resizeTerminal ?? "Resize terminal"}
        />

        <TooltipProvider delay={300}>
          <div className="flex h-8 shrink-0 items-center gap-0.5 border-b border-border/60 px-1">
            <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
              {ordered.map((s) => {
                const active = s.id === activeId
                return (
                  <ContextMenu key={s.id}>
                    <ContextMenuTrigger
                      className={cn(
                        "group/ttab flex h-7 max-w-[10rem] shrink-0 items-center gap-1 rounded-md px-2 text-xs",
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
                        className="flex min-w-0 items-center gap-1.5 outline-none"
                        onClick={() => setActiveId(s.id)}
                      >
                        {s.pinned ? (
                          <Pin className="size-3 shrink-0 opacity-70" />
                        ) : (
                          <TerminalSquare className="size-3 shrink-0 opacity-70" />
                        )}
                        <span className="truncate">{s.title}</span>
                      </button>
                      {!s.pinned ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                className={cn(
                                  "flex size-4 shrink-0 items-center justify-center rounded-sm opacity-0",
                                  "group-hover/ttab:opacity-100 hover:bg-background",
                                  active && "opacity-60"
                                )}
                                aria-label={
                                  labels?.closeTerminal ?? "Close terminal"
                                }
                                onClick={() => closeSession(s.id)}
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
          </div>
        </TooltipProvider>

        <div
          className="relative min-h-0 flex-1"
          style={{ height: Math.max(0, height - 32) }}
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
                    feed={s.id === activeId ? feed : null}
                    pty={s.id === activeId ? pty : null}
                    ptyFeed={s.id === activeId ? ptyFeed : null}
                  />
                </div>
              ))
            : null}
        </div>
      </div>
    </motion.div>
  )
}
