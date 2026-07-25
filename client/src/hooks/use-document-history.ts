import { useCallback, useMemo, useRef, useState } from "react"

const DEFAULT_MAX_DEPTH = 50
const DEFAULT_COALESCE_MS = 400

export type DocumentHistoryControls = {
  readonly undo: () => void
  readonly redo: () => void
  readonly canUndo: boolean
  readonly canRedo: boolean
}

function cloneSnapshot<T>(value: T): T {
  return structuredClone(value)
}

function sameSnapshot<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Local undo/redo stack for editor snapshots (document + style + template + title).
 *
 * - `commit(next)` after local state settles (typically a useEffect on the snapshot)
 * - `skipNext()` before remote/collab or history applies (do not push onto the stack)
 * - `markDiscrete()` before structural / style / template changes (end typing coalesce)
 */
export function useDocumentHistory<T>({
  maxDepth = DEFAULT_MAX_DEPTH,
  coalesceMs = DEFAULT_COALESCE_MS,
}: {
  readonly maxDepth?: number
  readonly coalesceMs?: number
} = {}) {
  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])
  const presentRef = useRef<T | null>(null)
  const skipRecordRef = useRef(false)
  const discreteRef = useRef(false)
  const lastPushAtRef = useRef(0)
  const [flags, setFlags] = useState({ canUndo: false, canRedo: false })

  const syncFlags = useCallback(() => {
    setFlags({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    })
  }, [])

  const commit = useCallback(
    (next: T) => {
      if (presentRef.current === null) {
        presentRef.current = cloneSnapshot(next)
        return
      }

      if (skipRecordRef.current) {
        skipRecordRef.current = false
        presentRef.current = cloneSnapshot(next)
        return
      }

      if (sameSnapshot(presentRef.current, next)) return

      const now = Date.now()
      const coalesce =
        !discreteRef.current && now - lastPushAtRef.current < coalesceMs

      if (!coalesce) {
        pastRef.current = [...pastRef.current, presentRef.current].slice(
          -maxDepth
        )
        futureRef.current = []
        lastPushAtRef.current = now
        syncFlags()
      } else {
        lastPushAtRef.current = now
      }

      presentRef.current = cloneSnapshot(next)
      discreteRef.current = false
    },
    [coalesceMs, maxDepth, syncFlags]
  )

  const skipNext = useCallback(() => {
    skipRecordRef.current = true
  }, [])

  const markDiscrete = useCallback(() => {
    discreteRef.current = true
  }, [])

  const undo = useCallback(
    (apply: (snapshot: T) => void) => {
      if (pastRef.current.length === 0 || presentRef.current === null) return
      const prev = pastRef.current[pastRef.current.length - 1]!
      pastRef.current = pastRef.current.slice(0, -1)
      futureRef.current = [presentRef.current, ...futureRef.current]
      presentRef.current = prev
      skipRecordRef.current = true
      apply(cloneSnapshot(prev))
      syncFlags()
    },
    [syncFlags]
  )

  const redo = useCallback(
    (apply: (snapshot: T) => void) => {
      if (futureRef.current.length === 0 || presentRef.current === null) return
      const next = futureRef.current[0]!
      futureRef.current = futureRef.current.slice(1)
      pastRef.current = [...pastRef.current, presentRef.current].slice(-maxDepth)
      presentRef.current = next
      skipRecordRef.current = true
      apply(cloneSnapshot(next))
      syncFlags()
    },
    [maxDepth, syncFlags]
  )

  return useMemo(
    () => ({
      commit,
      skipNext,
      markDiscrete,
      undo,
      redo,
      canUndo: flags.canUndo,
      canRedo: flags.canRedo,
    }),
    [
      commit,
      skipNext,
      markDiscrete,
      undo,
      redo,
      flags.canUndo,
      flags.canRedo,
    ]
  )
}
