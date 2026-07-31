import { useCallback, useEffect, useRef, useState } from "react"
import {
  createBrowserRunner,
  formatRunEventLine,
  languageFromPath,
  looksLikeWebAppEntry,
  type RuntimeLanguage,
} from "@mockmatch/browser-runner"
import type { IdeFormatPreset } from "../types"

export type TerminalFeed = { seq: number; chunk: string }

type UseBrowserRunActionsArgs = {
  preset: IdeFormatPreset
  activeTabId: string | undefined
  getFilesSnapshot: () => Record<string, string>
  setShowTerminal: (open: boolean | ((v: boolean) => boolean)) => void
}

/**
 * Wire IdeShell Run / Run tests to @mockmatch/browser-runner.
 * Streams RunEvents into terminalFeed for xterm.
 */
export function useBrowserRunActions({
  preset,
  activeTabId,
  getFilesSnapshot,
  setShowTerminal,
}: UseBrowserRunActionsArgs) {
  const [runBusy, setRunBusy] = useState(false)
  const [runTestsBusy, setRunTestsBusy] = useState(false)
  const [terminalFeed, setTerminalFeed] = useState<TerminalFeed | null>(null)
  const seqRef = useRef(0)
  const runnerRef = useRef<ReturnType<typeof createBrowserRunner> | null>(null)
  if (!runnerRef.current) {
    runnerRef.current = createBrowserRunner()
  }
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Recreate after Strict Mode dispose
    if (!runnerRef.current) {
      runnerRef.current = createBrowserRunner()
    }
    return () => {
      abortRef.current?.abort()
      runnerRef.current?.dispose()
      runnerRef.current = null
    }
  }, [])

  /**
   * Push one terminal chunk. Callers that fire many events in one turn
   * should join first — terminal panel also buffers until xterm mounts.
   */
  const pushTerminal = useCallback((chunk: string) => {
    if (!chunk) return
    seqRef.current += 1
    setTerminalFeed({ seq: seqRef.current, chunk })
  }, [])

  /** Wait 2 frames so IdeTerminalPanel bodyReady + xterm can mount. */
  const waitTerminalReady = useCallback(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      }),
    []
  )

  const resolveRunTarget = useCallback((): {
    language: RuntimeLanguage
    entryPath: string
    files: Record<string, string>
  } | null => {
    const files = getFilesSnapshot()
    const paths = Object.keys(files)
    if (paths.length === 0) return null

    if (preset.runtime) {
      let language = preset.runtime.language
      const entryPath = preset.runtime.entryPath
      if (
        (language === "typescript" || language === "javascript") &&
        looksLikeWebAppEntry(entryPath, files)
      ) {
        language = "nodejs"
      }
      return { language, entryPath, files }
    }

    const entryPath =
      (activeTabId && activeTabId in files ? activeTabId : null) ??
      paths.find((p) => languageFromPath(p) != null) ??
      paths[0]

    let language = languageFromPath(entryPath) ?? "javascript"
    if (
      (language === "typescript" || language === "javascript") &&
      looksLikeWebAppEntry(entryPath, files)
    ) {
      language = "nodejs"
    }
    return { language, entryPath, files }
  }, [activeTabId, getFilesSnapshot, preset.runtime])

  const onRun = useCallback(() => {
    if (runBusy || runTestsBusy) return

    const target = resolveRunTarget()
    if (!target) {
      setShowTerminal(true)
      pushTerminal("\r\nNo files to run.\r\n")
      return
    }

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setShowTerminal(true)
    setRunBusy(true)

    const runner = runnerRef.current
    if (!runner) {
      setRunBusy(false)
      return
    }

    void (async () => {
      // Buffer all output, then write once after xterm is mountable.
      // IdeTerminalPanel defers body by 2 rAF — streaming was lost.
      const parts: string[] = [
        `\r\n\x1b[36m═══ Run ${target.entryPath} (${target.language}) ═══\x1b[0m\r\n`,
      ]

      try {
        await runner.run(
          {
            language: target.language,
            files: target.files,
            entryPath: target.entryPath,
          },
          (event) => {
            const line = formatRunEventLine(event)
            if (line) parts.push(line)
          },
          ac.signal
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        parts.push(`\r\n\x1b[31m${msg}\x1b[0m\r\n`)
      }

      await waitTerminalReady()
      if (!ac.signal.aborted) {
        pushTerminal(parts.join(""))
      }
      if (abortRef.current === ac) abortRef.current = null
      setRunBusy(false)
    })()
  }, [
    pushTerminal,
    resolveRunTarget,
    runBusy,
    runTestsBusy,
    setShowTerminal,
    waitTerminalReady,
  ])

  const onRunTests = useCallback(() => {
    if (runBusy || runTestsBusy) return
    setShowTerminal(true)
    setRunTestsBusy(true)
    pushTerminal(
      "\r\n\x1b[90mTest runner not wired yet (I/O cases land with the next browser-runner phase).\x1b[0m\r\n"
    )
    window.setTimeout(() => setRunTestsBusy(false), 400)
  }, [pushTerminal, runBusy, runTestsBusy, setShowTerminal])

  return {
    onRun,
    onRunTests,
    runBusy,
    runTestsBusy,
    terminalFeed,
  }
}
