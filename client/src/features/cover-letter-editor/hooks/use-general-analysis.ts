import { useEffect, useMemo, useRef, useState } from "react"
import { lintText } from "@/lib/grammar/harper"
import {
  analyzeStructure,
  buildResult,
  collectPlainText,
  grammarFindingsFromIssues,
  type AnalysisFinding,
  type GeneralAnalysisResult,
} from "../lib/general-analysis"
import type { CoverLetterDocument } from "../types"

export interface UseGeneralAnalysisResult extends GeneralAnalysisResult {
  readonly isLinting: boolean
}

const emptyResult = buildResult([])

/**
 * Live general analysis: structural rules sync, Harper grammar debounced.
 * Findings sorted by severity; score 0–100.
 */
export function useGeneralAnalysis(
  document: CoverLetterDocument,
  enabled = true,
  delay = 600
): UseGeneralAnalysisResult {
  const structural = useMemo(
    () => (enabled ? analyzeStructure(document) : []),
    [document, enabled]
  )

  const plainText = useMemo(
    () => (enabled ? collectPlainText(document) : ""),
    [document, enabled]
  )

  const [grammarFindings, setGrammarFindings] = useState<AnalysisFinding[]>([])
  const [isLinting, setIsLinting] = useState(false)
  const latest = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setGrammarFindings([])
      setIsLinting(false)
      return
    }

    const token = ++latest.current
    setIsLinting(true)
    const timer = setTimeout(() => {
      lintText(plainText)
        .then((issues) => {
          if (token !== latest.current) return
          setGrammarFindings(grammarFindingsFromIssues(issues))
          setIsLinting(false)
        })
        .catch(() => {
          if (token !== latest.current) return
          setGrammarFindings([])
          setIsLinting(false)
        })
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [plainText, enabled, delay])

  return useMemo(() => {
    if (!enabled) {
      return { ...emptyResult, isLinting: false }
    }
    const result = buildResult([...structural, ...grammarFindings])
    return { ...result, isLinting }
  }, [structural, grammarFindings, isLinting, enabled])
}
