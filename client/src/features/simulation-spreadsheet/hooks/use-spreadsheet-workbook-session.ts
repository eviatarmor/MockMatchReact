import { useCallback, useEffect, useRef, useState } from "react"
import {
  createEmptyWorkbook,
  type SpreadsheetDocument,
} from "@mockmatch/spreadsheet"
import { trpc } from "@/lib/trpc"

type SaveStatus = "idle" | "saving" | "saved" | "error"

/**
 * Creates a durable spreadsheet workbook and debounced-autosaves document.
 * Collab via document_kind `spreadsheet` + board id.
 */
export function useSpreadsheetWorkbookSession(opts: {
  readonly title: string
  readonly enabled: boolean
  /** When reopening via share link ?id= */
  readonly existingId?: string | null
}) {
  const { title, enabled, existingId } = opts
  const [workbookId, setWorkbookId] = useState<string | null>(null)
  const [seedDoc, setSeedDoc] = useState<SpreadsheetDocument | null>(null)
  const [ready, setReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const create = trpc.spreadsheet.create.useMutation()
  const update = trpc.spreadsheet.update.useMutation()
  const getUtils = trpc.useUtils()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    idRef.current = workbookId
  }, [workbookId])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setReady(false)
    void (async () => {
      try {
        if (existingId) {
          const row = await getUtils.client.spreadsheet.get.query({
            id: existingId,
          })
          if (cancelled) return
          setWorkbookId(row.id)
          setSeedDoc(row.document as SpreadsheetDocument)
          setReady(true)
          return
        }
        const row = await create.mutateAsync({
          title,
          document: createEmptyWorkbook({ sheetName: "Sheet1" }) as never,
        })
        if (cancelled) return
        setWorkbookId(row.id)
        setSeedDoc(row.document as SpreadsheetDocument)
        setReady(true)
      } catch {
        if (cancelled) return
        setWorkbookId(null)
        setSeedDoc(createEmptyWorkbook({ sheetName: "Sheet1" }))
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, existingId, title])

  const scheduleSave = useCallback(
    (document: SpreadsheetDocument) => {
      const id = idRef.current
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

  return { workbookId, seedDoc, ready, saveStatus, scheduleSave }
}
