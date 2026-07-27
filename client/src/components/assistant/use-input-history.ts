import { useCallback, useMemo, useRef } from "react"

const DEFAULT_COALESCE_MS = 400
const DEFAULT_MAX_DEPTH = 100

export type InputHistorySnapshot = {
  readonly text: string
  readonly selectionStart: number
  readonly selectionEnd: number
}

/**
 * Local undo/redo for a text field when native browser history is insufficient.
 * Coalesces rapid typing like a normal editor.
 */
export function useInputHistory({
  coalesceMs = DEFAULT_COALESCE_MS,
  maxDepth = DEFAULT_MAX_DEPTH,
}: {
  readonly coalesceMs?: number
  readonly maxDepth?: number
} = {}) {
  const pastRef = useRef<InputHistorySnapshot[]>([])
  const futureRef = useRef<InputHistorySnapshot[]>([])
  const presentRef = useRef<InputHistorySnapshot>({
    text: "",
    selectionStart: 0,
    selectionEnd: 0,
  })
  const lastPushAtRef = useRef(0)
  /** Skip recording while we apply undo/redo ourselves. */
  const applyingRef = useRef(false)

  const reset = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    presentRef.current = { text: "", selectionStart: 0, selectionEnd: 0 }
    lastPushAtRef.current = 0
    applyingRef.current = false
  }, [])

  const record = useCallback(
    (text: string, selectionStart = text.length, selectionEnd = text.length) => {
      if (applyingRef.current) return
      const next: InputHistorySnapshot = {
        text,
        selectionStart,
        selectionEnd,
      }
      const present = presentRef.current
      if (present.text === next.text) {
        presentRef.current = next
        return
      }

      const now = Date.now()
      const coalesce = now - lastPushAtRef.current < coalesceMs

      if (!coalesce) {
        pastRef.current = [...pastRef.current, present].slice(-maxDepth)
        futureRef.current = []
      }
      // Coalesced: only advance present (replace last typing burst endpoint).
      presentRef.current = next
      lastPushAtRef.current = now
    },
    [coalesceMs, maxDepth]
  )

  /** Force a discrete boundary (mention insert, speech, paste). */
  const markDiscrete = useCallback(() => {
    lastPushAtRef.current = 0
  }, [])

  const undo = useCallback((): InputHistorySnapshot | null => {
    if (pastRef.current.length === 0) return null
    const prev = pastRef.current[pastRef.current.length - 1]!
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [presentRef.current, ...futureRef.current]
    presentRef.current = prev
    applyingRef.current = true
    return prev
  }, [])

  const redo = useCallback((): InputHistorySnapshot | null => {
    if (futureRef.current.length === 0) return null
    const next = futureRef.current[0]!
    futureRef.current = futureRef.current.slice(1)
    pastRef.current = [...pastRef.current, presentRef.current].slice(-maxDepth)
    presentRef.current = next
    applyingRef.current = true
    return next
  }, [maxDepth])

  const finishApply = useCallback(() => {
    applyingRef.current = false
  }, [])

  const getPresent = useCallback(() => presentRef.current, [])

  return useMemo(
    () => ({
      record,
      markDiscrete,
      undo,
      redo,
      reset,
      finishApply,
      getPresent,
    }),
    [record, markDiscrete, undo, redo, reset, finishApply, getPresent]
  )
}

export type UseInputHistoryReturn = ReturnType<typeof useInputHistory>
