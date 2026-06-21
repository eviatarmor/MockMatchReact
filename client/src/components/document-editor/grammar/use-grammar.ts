import { useEffect, useRef, useState } from "react"
import { lintText, type GrammarIssue } from "@/lib/grammar/harper"

/**
 * Debounced grammar check for a plain-text string. Returns the current issues
 * (empty until the first check resolves). Stale results are dropped when `text`
 * changes mid-flight, so the issues always match the latest input.
 */
export function useGrammar(text: string, enabled = true, delay = 600): GrammarIssue[] {
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
      lintText(text)
        .then((result) => {
          if (token === latest.current) setIssues(result)
        })
        .catch(() => {
          if (token === latest.current) setIssues([])
        })
    }, delay)
    return () => clearTimeout(timer)
  }, [text, enabled, delay])

  return issues
}
