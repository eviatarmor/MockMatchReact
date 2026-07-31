import { useEffect, useRef } from "react"
import { createBrowserRunner } from "../create-browser-runner"
import type { BrowserRunner, BrowserRunnerOptions } from "../types"

/**
 * React helper: one BrowserRunner per mount, disposed on unmount.
 * Optional — hosts may call `createBrowserRunner` directly.
 */
export function useBrowserRunner(
  options?: BrowserRunnerOptions
): BrowserRunner {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const runnerRef = useRef<BrowserRunner | null>(null)
  if (!runnerRef.current) {
    runnerRef.current = createBrowserRunner(optionsRef.current)
  }

  useEffect(() => {
    return () => {
      runnerRef.current?.dispose()
      runnerRef.current = null
    }
  }, [])

  return runnerRef.current
}
