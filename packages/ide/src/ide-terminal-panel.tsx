import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Pin, Plus, TerminalSquare, X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@mockmatch/ui/context-menu"
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

const TERM_SPRING = { type: "spring" as const, stiffness: 380, damping: 36 }

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
}: IdeTerminalPanelProps) {
  const [sessions, setSessions] = useState<IdeTerminalSession[]>(() => [
    newSession(defaultCwd),
  ])
  const [activeId, setActiveId] = useState(() => sessions[0]!.id)

  const { height, startResize, isDragging } = useBottomPanelHeight({
    defaultHeight,
    min: minHeight,
    max: maxHeight,
    storageKey: "mockmatch.ide.terminal-height",
  })

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

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="ide-terminal-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={isDragging ? { duration: 0 } : TERM_SPRING}
          className="relative shrink-0 overflow-hidden border-t border-border bg-background"
          data-slot="ide-terminal-panel"
        >
          <div
            className="relative flex h-full min-h-0 flex-col"
            style={{ height }}
          >
            <TerminalResizeHandle
              onPointerDown={startResize}
              label={labels?.resizeTerminal ?? "Resize terminal"}
            />

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
                          >
                            <X className="size-3" />
                          </button>
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
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={labels?.newTerminal ?? "New terminal"}
                onClick={addSession}
              >
                <Plus className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Hide terminal"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>

            <div
              className="relative min-h-0 flex-1"
              style={{ height: Math.max(0, height - 32) }}
            >
              {sessions.map((s) => (
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
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
