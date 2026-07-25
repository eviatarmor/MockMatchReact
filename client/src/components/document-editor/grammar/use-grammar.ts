import { useEffect, useRef, useState } from "react"
import { lintText, type GrammarIssue } from "@/lib/grammar/harper"
import { useRegionPreferences } from "@/hooks/use-region-preferences"

/**
 * Debounced grammar check for a plain-text string. Returns the current issues
 * (empty until the first check resolves). Stale results are dropped when `text`
 * changes mid-flight, so the issues always match the latest input.
 * Dialect follows account country (US/AU/GB → Harper American/Australian/British).
 */
export function useGrammar(text: string, enabled = true, delay = 600): GrammarIssue[] {
  const { dialect } = useRegionPreferences()
  const [issues, setIssues] = useState<GrammarIssue[]>([])
  // Track the latest request so an earlier, slower lint can't overwrite it.
  const latest = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setIssues([])
      return
    }
    const token = ++latest.current
    const timer = setTimeout(() => {
      lintText(text, { dialect })
        .then((result) => {
          if (token === latest.current) setIssues(result)
        })
        .catch(() => {
          if (token === latest.current) setIssues([])
        })
    }, delay)
    return () => clearTimeout(timer)
  }, [text, enabled, delay, dialect])

  return issues
}
