import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { cn } from "@mockmatch/ui/utils"

import type { ResolvedColorScheme } from "./use-color-scheme"

import "@xterm/xterm/css/xterm.css"

export type IdeTerminalPtyApi = {
  /** When true, raw keystrokes go to the host (SSH-like). */
  active: boolean
  onData: (data: string) => void
  onResize?: (cols: number, rows: number) => void
}

export type IdeTerminalProps = {
  className?: string
  colorScheme?: ResolvedColorScheme
  welcome?: string
  cwd?: string
  /** Host command runner (line mode). Ignored when `pty.active`. */
  onCommand?: (
    command: string
  ) => string | string[] | void | Promise<string | string[] | void>
  /**
   * Host push feed (Run/Tests banners, etc.). Write raw chunk when `seq` changes.
   */
  feed?: { seq: number; chunk: string } | null
  /**
   * SSH-like PTY: disable local echo/prompt; stream keys to host;
   * write `ptyFeed` / remote output into xterm.
   */
  pty?: IdeTerminalPtyApi | null
  ptyFeed?: { seq: number; chunk: string } | null
}

function themeForScheme(scheme: ResolvedColorScheme) {
  if (scheme === "light") {
    return {
      background: "#fafafa",
      foreground: "#171717",
      cursor: "#171717",
      selectionBackground: "#d4d4d8",
    }
  }
  return {
    background: "#0a0a0a",
    foreground: "#e5e5e5",
    cursor: "#e5e5e5",
    selectionBackground: "#3f3f46",
  }
}

function writeLines(term: Terminal, lines: string | string[] | void) {
  if (lines == null) return
  const list = Array.isArray(lines) ? lines : [lines]
  for (const line of list) {
    term.writeln(line)
  }
}

/**
 * Interactive xterm.js panel.
 * - Default: local echo line shell
 * - `pty.active`: raw passthrough (host-owned remote shell over WS)
 */
export function IdeTerminal({
  className,
  colorScheme = "dark",
  welcome = "MockMatch terminal — type help, then Enter.",
  cwd = "/workspace",
  onCommand,
  feed,
  pty = null,
  ptyFeed,
}: IdeTerminalProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const lineRef = useRef("")
  const onCommandRef = useRef(onCommand)
  const cwdRef = useRef(cwd)
  const ptyRef = useRef(pty)
  const lastFeedSeq = useRef(0)
  const lastPtyFeedSeq = useRef(0)
  const welcomeShown = useRef(false)

  useEffect(() => {
    onCommandRef.current = onCommand
  }, [onCommand])

  useEffect(() => {
    cwdRef.current = cwd
  }, [cwd])

  useEffect(() => {
    ptyRef.current = pty
  }, [pty])

  useEffect(() => {
    if (!feed || feed.seq === lastFeedSeq.current) return
    lastFeedSeq.current = feed.seq
    const term = termRef.current
    if (!term) return
    // In local line mode, clear partial input so banners don't glue
    if (!ptyRef.current?.active && lineRef.current.length > 0) {
      term.write("\r\n")
      lineRef.current = ""
    }
    term.write(feed.chunk)
  }, [feed])

  useEffect(() => {
    if (!ptyFeed || ptyFeed.seq === lastPtyFeedSeq.current) return
    lastPtyFeedSeq.current = ptyFeed.seq
    const term = termRef.current
    if (!term) return
    term.write(ptyFeed.chunk)
  }, [ptyFeed])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      theme: themeForScheme(colorScheme),
      convertEol: true,
      scrollback: 5000,
      // Remote shell echoes when PTY is active
      disableStdin: false,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(host)
    fit.fit()

    termRef.current = term
    fitRef.current = fit
    lineRef.current = ""

    if (!welcomeShown.current && welcome) {
      welcomeShown.current = true
      // PTY: short banner then wait for remote prompt; local: show fake prompt
      if (ptyRef.current?.active) {
        term.writeln(welcome)
      } else {
        term.writeln(welcome)
        term.write(`\x1b[32m${cwd}\x1b[0m $ `)
      }
    }

    const prompt = () => {
      term.write(`\r\n\x1b[32m${cwdRef.current}\x1b[0m $ `)
    }

    const runCommand = async (raw: string) => {
      const command = raw.trim()
      if (!command) {
        prompt()
        return
      }

      if (command === "clear" || command === "cls") {
        term.clear()
        prompt()
        return
      }

      if (onCommandRef.current) {
        if (command === "help") {
          term.writeln("Host runner is active. Prefer the live remote PTY.")
          prompt()
          return
        }
        try {
          const out = await onCommandRef.current(command)
          writeLines(term, out)
        } catch (err) {
          term.writeln(
            `\x1b[31m${err instanceof Error ? err.message : String(err)}\x1b[0m`
          )
        }
        prompt()
        return
      }

      if (command === "help") {
        term.writeln("Built-in: help, clear, echo <text>, pwd")
        prompt()
        return
      }

      if (command === "pwd") {
        term.writeln(cwdRef.current)
        prompt()
        return
      }

      if (command.startsWith("echo ")) {
        term.writeln(command.slice(5))
        prompt()
        return
      }

      term.writeln(
        `\x1b[33mcommand not found: ${command.split(/\s+/)[0]}\x1b[0m`
      )
      prompt()
    }

    const disposable = term.onData((data) => {
      const p = ptyRef.current
      if (p?.active) {
        // Raw passthrough — bash echoes, handles editing, Ctrl+C, …
        p.onData(data)
        return
      }

      for (const ch of data) {
        const code = ch.charCodeAt(0)
        if (ch === "\r" || ch === "\n") {
          const line = lineRef.current
          lineRef.current = ""
          term.write("\r\n")
          void runCommand(line)
          continue
        }
        if (ch === "\x7f" || ch === "\b") {
          if (lineRef.current.length > 0) {
            lineRef.current = lineRef.current.slice(0, -1)
            term.write("\b \b")
          }
          continue
        }
        if (code === 3) {
          lineRef.current = ""
          term.write("^C")
          prompt()
          continue
        }
        if (code === 12) {
          term.clear()
          term.write(`\x1b[32m${cwdRef.current}\x1b[0m $ ${lineRef.current}`)
          continue
        }
        if (code < 32) continue
        lineRef.current += ch
        term.write(ch)
      }
    })

    const ro = new ResizeObserver(() => {
      try {
        fit.fit()
        const p = ptyRef.current
        if (p?.active && p.onResize) {
          p.onResize(term.cols, term.rows)
        }
      } catch {
        // ignore fit races while hidden
      }
    })
    ro.observe(host)

    return () => {
      disposable.dispose()
      ro.disconnect()
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
    // Mount once; theme updates below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const term = termRef.current
    if (!term) return
    term.options.theme = themeForScheme(colorScheme)
  }, [colorScheme])

  // Notify host of size when PTY becomes active
  useEffect(() => {
    if (!pty?.active || !pty.onResize) return
    const term = termRef.current
    if (!term) return
    pty.onResize(term.cols, term.rows)
  }, [pty?.active, pty])

  return (
    <div
      ref={hostRef}
      className={cn("h-full w-full overflow-hidden px-1 py-1", className)}
      data-slot="ide-terminal"
    />
  )
}
