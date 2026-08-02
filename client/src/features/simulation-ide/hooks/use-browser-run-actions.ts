import { useCallback, useEffect, useRef, useState } from "react"
import {
  createBrowserRunner,
  formatRunEventLine,
  languageFromPath,
  looksLikeWebAppEntry,
  type RuntimeLanguage,
} from "@mockmatch/browser-runner"
import { fireCelebrationConfetti } from "@mockmatch/ui/confetti"
import type { IdeFormatPreset, IoTestCase } from "../types"

export type TerminalFeed = { seq: number; chunk: string }

type RuntimeOverride = {
  language?: RuntimeLanguage
  entryPath?: string
  tests?: readonly IoTestCase[]
}

type UseBrowserRunActionsArgs = {
  preset: IdeFormatPreset
  activeTabId: string | undefined
  getFilesSnapshot: () => Record<string, string>
  setShowTerminal: (open: boolean | ((v: boolean) => boolean)) => void
  /** Bank / catalog override when preset has no runtime (e.g. generated Qs). */
  runtimeOverride?: RuntimeOverride | null
}

/**
 * Wire IdeShell Run / Run tests to @mockmatch/browser-runner.
 * Buffers output then flushes after xterm is mountable.
 */
export function useBrowserRunActions({
  preset,
  activeTabId,
  getFilesSnapshot,
  setShowTerminal,
  runtimeOverride,
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
    if (!runnerRef.current) {
      runnerRef.current = createBrowserRunner()
    }
    return () => {
      abortRef.current?.abort()
      runnerRef.current?.dispose()
      runnerRef.current = null
    }
  }, [])

  const pushTerminal = useCallback((chunk: string) => {
    if (!chunk) return
    seqRef.current += 1
    setTerminalFeed({ seq: seqRef.current, chunk })
  }, [])

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
    tests?: readonly IoTestCase[]
  } | null => {
    const files = getFilesSnapshot()
    const paths = Object.keys(files)
    if (paths.length === 0) return null

    const runtime = preset.runtime
      ? {
          language: preset.runtime.language as RuntimeLanguage,
          entryPath: preset.runtime.entryPath,
          tests: preset.runtime.tests,
        }
      : runtimeOverride?.language || runtimeOverride?.entryPath
        ? {
            language: (runtimeOverride.language ??
              "javascript") as RuntimeLanguage,
            entryPath:
              runtimeOverride.entryPath ??
              paths[0]!,
            tests: runtimeOverride.tests,
          }
        : null

    if (runtime) {
      let language = runtime.language
      const entryPath =
        runtime.entryPath in files
          ? runtime.entryPath
          : (paths[0] ?? runtime.entryPath)
      if (
        (language === "typescript" || language === "javascript") &&
        looksLikeWebAppEntry(entryPath, files)
      ) {
        language = "nodejs"
      }
      return {
        language,
        entryPath,
        files,
        tests: runtime.tests,
      }
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
  }, [activeTabId, getFilesSnapshot, preset.runtime, runtimeOverride])

  const execute = useCallback(
    (mode: "run" | "tests") => {
      if (runBusy || runTestsBusy) return

      const target = resolveRunTarget()
      if (!target) {
        setShowTerminal(true)
        pushTerminal("\r\nNo files to run.\r\n")
        return
      }

      if (mode === "tests" && (!target.tests || target.tests.length === 0)) {
        setShowTerminal(true)
        pushTerminal(
          "\r\n\x1b[90mNo tests defined for this exercise.\x1b[0m\r\n"
        )
        return
      }

      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      setShowTerminal(true)
      if (mode === "tests") setRunTestsBusy(true)
      else setRunBusy(true)

      const runner = runnerRef.current
      if (!runner) {
        setRunBusy(false)
        setRunTestsBusy(false)
        return
      }

      void (async () => {
        const label =
          mode === "tests"
            ? `═══ Tests ${target.entryPath} (${target.language}) ═══`
            : `═══ Run ${target.entryPath} (${target.language}) ═══`
        const parts: string[] = [`\r\n\x1b[36m${label}\x1b[0m\r\n`]
        let testCount = 0
        let testsPassed = 0
        let exitCode: number | null = null

        try {
          await runner.run(
            {
              language: target.language,
              files: target.files,
              entryPath: target.entryPath,
              tests:
                mode === "tests" && target.tests
                  ? target.tests.map((t) => ({
                      name: t.name,
                      stdin: t.stdin,
                      expectedStdout: t.expectedStdout,
                    }))
                  : undefined,
            },
            (event) => {
              const line = formatRunEventLine(event)
              if (line) parts.push(line)
              if (mode === "tests" && event.type === "test-result") {
                testCount += 1
                if (event.pass) testsPassed += 1
              }
              if (event.type === "exit") {
                exitCode = event.code
              }
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
          // All tests green — same celebration as MCQ perfect set
          if (
            mode === "tests" &&
            testCount > 0 &&
            testsPassed === testCount &&
            exitCode === 0
          ) {
            const originBtn =
              typeof document !== "undefined"
                ? document.querySelector("[data-slot='ide-run-tests']")
                : null
            void fireCelebrationConfetti({ element: originBtn })
          }
        }
        if (abortRef.current === ac) abortRef.current = null
        setRunBusy(false)
        setRunTestsBusy(false)
      })()
    },
    [
      pushTerminal,
      resolveRunTarget,
      runBusy,
      runTestsBusy,
      setShowTerminal,
      waitTerminalReady,
    ]
  )

  const onRun = useCallback(() => execute("run"), [execute])
  const onRunTests = useCallback(() => execute("tests"), [execute])

  return {
    onRun,
    onRunTests,
    runBusy,
    runTestsBusy,
    terminalFeed,
  }
}
