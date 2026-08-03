import { useCallback, useEffect, useMemo, useState } from "react"
import { shuffleIndices } from "./shuffle-indices"
import type {
  McqItemResult,
  McqItemState,
  McqQuestion,
  McqSessionApi,
  McqVariant,
} from "./types"
import { variantOf } from "./variant"

export type UseMcqSessionOptions = {
  readonly questions: readonly McqQuestion[]
  /**
   * Change this when the question set identity changes (e.g. seed id + fetch
   * stamp) so the session resets.
   */
  readonly sessionKey?: string
  /** Fired when the user finishes the set with every item correct. */
  readonly onPerfectSet?: () => void
}

export function useMcqSession({
  questions,
  sessionKey,
  onPerfectSet,
}: UseMcqSessionOptions): McqSessionApi {
  const [index, setIndex] = useState(0)
  const [itemState, setItemState] = useState<Record<string, McqItemState>>({})
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setIndex(0)
    setItemState({})
    setFinished(false)
  }, [sessionKey])

  const current: McqQuestion | undefined = questions[index]
  const currentState = current ? itemState[current.id] : undefined
  const revealed = Boolean(currentState?.result)
  const currentVariant: McqVariant = current ? variantOf(current) : "single"

  // Seed order-variant shuffle when first viewing a question
  useEffect(() => {
    if (!current || currentVariant !== "order") return
    setItemState((prev) => {
      if (prev[current.id]?.orderedIndices) return prev
      return {
        ...prev,
        [current.id]: {
          ...prev[current.id],
          orderedIndices: shuffleIndices(current.options.length, current.id),
        },
      }
    })
  }, [current, currentVariant])

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => itemState[q.id]?.result !== undefined).length,
    [questions, itemState]
  )
  const correctCount = useMemo(
    () =>
      questions.filter((q) => itemState[q.id]?.result?.correct === true).length,
    [questions, itemState]
  )

  const canCheck = useMemo(() => {
    if (!current || revealed) return false
    if (currentVariant === "single") {
      return currentState?.selectedIndex !== undefined
    }
    if (currentVariant === "multi") {
      return (currentState?.selectedIndices?.length ?? 0) > 0
    }
    return (
      (currentState?.orderedIndices?.length ?? 0) === current.options.length
    )
  }, [current, currentState, currentVariant, revealed])

  const selectSingle = useCallback(
    (value: string | null) => {
      if (!current || revealed || value == null) return
      const n = Number.parseInt(value, 10)
      if (Number.isNaN(n)) return
      setItemState((prev) => ({
        ...prev,
        [current.id]: { ...prev[current.id], selectedIndex: n },
      }))
    },
    [current, revealed]
  )

  const toggleMulti = useCallback(
    (optIndex: number, checked: boolean) => {
      if (!current || revealed) return
      setItemState((prev) => {
        const cur = prev[current.id]?.selectedIndices ?? []
        const next = checked
          ? [...new Set([...cur, optIndex])].sort((a, b) => a - b)
          : cur.filter((i) => i !== optIndex)
        return {
          ...prev,
          [current.id]: { ...prev[current.id], selectedIndices: next },
        }
      })
    },
    [current, revealed]
  )

  const reorder = useCallback(
    (next: number[]) => {
      if (!current || revealed) return
      setItemState((prev) => ({
        ...prev,
        [current.id]: { ...prev[current.id], orderedIndices: next },
      }))
    },
    [current, revealed]
  )

  const applyResult = useCallback(
    (
      id: string,
      result: McqItemResult,
      selection?: {
        selectedIndex?: number
        selectedIndices?: number[]
        orderedIndices?: number[]
      }
    ) => {
      setItemState((prev) => {
        const prior = prev[id] ?? {}
        return {
          ...prev,
          [id]: {
            ...prior,
            selectedIndex: selection?.selectedIndex ?? prior.selectedIndex,
            selectedIndices:
              selection?.selectedIndices ?? prior.selectedIndices,
            orderedIndices:
              selection?.orderedIndices ?? prior.orderedIndices,
            result,
          },
        }
      })
    },
    []
  )

  const goNext = useCallback(() => {
    if (index >= questions.length - 1) {
      const allCorrect =
        questions.length > 0 &&
        questions.every((q) => itemState[q.id]?.result?.correct === true)
      setFinished(true)
      if (allCorrect) onPerfectSet?.()
      return
    }
    setIndex((i) => i + 1)
  }, [index, questions, itemState, onPerfectSet])

  const goPrev = useCallback(() => {
    setFinished(false)
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const jumpTo = useCallback((i: number) => {
    setFinished(false)
    setIndex(i)
  }, [])

  const restart = useCallback(() => {
    setIndex(0)
    setItemState({})
    setFinished(false)
  }, [])

  const resetSession = useCallback(() => {
    setIndex(0)
    setItemState({})
    setFinished(false)
  }, [])

  return {
    index,
    finished,
    itemState,
    answeredCount,
    correctCount,
    canCheck,
    current,
    currentState,
    revealed,
    currentVariant,
    selectSingle,
    toggleMulti,
    reorder,
    goNext,
    goPrev,
    jumpTo,
    restart,
    applyResult,
    resetSession,
  }
}
