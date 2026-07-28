import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { cn } from "@mockmatch/ui/utils"

import type { ResolvedColorScheme } from "./use-color-scheme"

import "@xterm/xterm/css/xterm.css"

export type IdeTerminalProps = {
  className?: string
  colorScheme?: ResolvedColorScheme
  welcome?: string
  cwd?: string
  /** Host command runner; return text to print. */
  onCommand?: (
    command: string
  ) => string | string[] | void | Promise<string | string[] | void>
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
 * Interactive xterm.js panel. Local echo shell by default;
 * host can supply `onCommand` for real runners later.
 */
export function IdeTerminal({
  className,
  colorScheme = "dark",
  welcome = "MockMatch terminal preview — type help, then Enter.",
  cwd = "~/workspace",
  onCommand,
}: IdeTerminalProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const lineRef = useRef("")
  const onCommandRef = useRef(onCommand)
  const cwdRef = useRef(cwd)

  useEffect(() => {
    onCommandRef.current = onCommand
  }, [onCommand])

  useEffect(() => {
    cwdRef.current = cwd
  }, [cwd])

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
      scrollback: 2000,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(host)
    fit.fit()

    termRef.current = term
    fitRef.current = fit
    lineRef.current = ""

    const prompt = () => {
      term.write(`\r\n\x1b[32m${cwdRef.current}\x1b[0m $ `)
    }

    term.writeln(welcome)
    term.write(`\x1b[32m${cwd}\x1b[0m $ `)

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

      if (command === "help") {
        term.writeln("Built-in: help, clear, echo <text>, pwd")
        term.writeln("Host can wire onTerminalCommand for real runners.")
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

      if (onCommandRef.current) {
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

      term.writeln(
        `\x1b[33mcommand not found: ${command.split(/\s+/)[0]}\x1b[0m`
      )
      prompt()
    }

    const disposable = term.onData((data) => {
      for (const ch of data) {
        const code = ch.charCodeAt(0)
        // Enter
        if (ch === "\r" || ch === "\n") {
          const line = lineRef.current
          lineRef.current = ""
          term.write("\r\n")
          void runCommand(line)
          continue
        }
        // Backspace
        if (ch === "\x7f" || ch === "\b") {
          if (lineRef.current.length > 0) {
            lineRef.current = lineRef.current.slice(0, -1)
            term.write("\b \b")
          }
          continue
        }
        // Ctrl+C
        if (code === 3) {
          lineRef.current = ""
          term.write("^C")
          prompt()
          continue
        }
        // Ctrl+L clear
        if (code === 12) {
          term.clear()
          term.write(`\x1b[32m${cwdRef.current}\x1b[0m $ ${lineRef.current}`)
          continue
        }
        // Ignore other controls
        if (code < 32) continue

        lineRef.current += ch
        term.write(ch)
      }
    })

    const ro = new ResizeObserver(() => {
      try {
        fit.fit()
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

  return (
    <div
      ref={hostRef}
      className={cn("h-full w-full overflow-hidden px-1 py-1", className)}
      data-slot="ide-terminal"
    />
  )
}
