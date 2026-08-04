import { useCallback, useEffect, useRef, useState } from "react"
import {
  createEmptyBoard,
  type WhiteboardDocument,
} from "@mockmatch/whiteboard"
import { trpc } from "@/lib/trpc"

type SaveStatus = "idle" | "saving" | "saved" | "error"

/**
 * Creates a durable board for a bank question and debounced-autosaves document.
 * Pass `existingBoardId` (e.g. from session `?boardId=`) to resume instead of create.
 */
export function useWhiteboardBoardSession(opts: {
  readonly questionId: string | null
  readonly title: string
  readonly enabled: boolean
  readonly existingBoardId?: string | null
}) {
  const { questionId, title, enabled, existingBoardId } = opts
  const [boardId, setBoardId] = useState<string | null>(null)
  const [seedDoc, setSeedDoc] = useState<WhiteboardDocument | null>(null)
  const [ready, setReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const create = trpc.whiteboard.create.useMutation()
  const update = trpc.whiteboard.update.useMutation()
  const utils = trpc.useUtils()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boardIdRef = useRef<string | null>(null)

  useEffect(() => {
    boardIdRef.current = boardId
  }, [boardId])

  useEffect(() => {
    if (!enabled || !questionId) return
    let cancelled = false
    setReady(false)
    setBoardId(null)
    setSeedDoc(null)
    void (async () => {
      try {
        if (existingBoardId) {
          const row = await utils.whiteboard.get.fetch({ id: existingBoardId })
          if (cancelled) return
          setBoardId(row.id)
          const doc = row.document as WhiteboardDocument
          setSeedDoc(doc?.version === 1 ? doc : createEmptyBoard())
          setReady(true)
          return
        }
        const row = await create.mutateAsync({
          title,
          questionId,
          document: createEmptyBoard() as never,
        })
        if (cancelled) return
        setBoardId(row.id)
        const doc = row.document as WhiteboardDocument
        setSeedDoc(doc?.version === 1 ? doc : createEmptyBoard())
        setReady(true)
      } catch {
        if (cancelled) return
        // Local-only fallback if API not migrated yet
        setBoardId(null)
        setSeedDoc(createEmptyBoard())
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // create/load once per question + board open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, questionId, existingBoardId])

  const scheduleSave = useCallback(
    (document: WhiteboardDocument) => {
      const id = boardIdRef.current
      if (!id) return
      if (timerRef.current) clearTimeout(timerRef.current)
      setSaveStatus("saving")
      timerRef.current = setTimeout(() => {
        void update
          .mutateAsync({ id, document: document as never })
          .then(() => setSaveStatus("saved"))
          .catch(() => setSaveStatus("error"))
      }, 800)
    },
    [update]
  )

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return { boardId, seedDoc, ready, saveStatus, scheduleSave }
}
