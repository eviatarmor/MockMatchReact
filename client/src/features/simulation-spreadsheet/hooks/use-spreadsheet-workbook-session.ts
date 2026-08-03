import { useCallback, useEffect, useRef, useState } from "react"
import {
  createEmptyWorkbook,
  type SpreadsheetDocument,
} from "@mockmatch/spreadsheet"
import { trpc } from "@/lib/trpc"

type SaveStatus = "idle" | "saving" | "saved" | "error"

/**
 * Creates a durable spreadsheet workbook (optional bank seed) and autosaves.
 * Collab via document_kind `spreadsheet`.
 */
export function useSpreadsheetWorkbookSession(opts: {
  readonly title: string
  readonly enabled: boolean
  /** When reopening via share link ?id= */
  readonly existingId?: string | null
  /** Bank question id (?questionId=) — seeds starter workbook. */
  readonly questionId?: string | null
}) {
  const { title, enabled, existingId, questionId } = opts
  const [workbookId, setWorkbookId] = useState<string | null>(null)
  const [seedDoc, setSeedDoc] = useState<SpreadsheetDocument | null>(null)
  const [prompt, setPrompt] = useState<string | null>(null)
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
          setPrompt(null)
          setReady(true)
          return
        }

        let document: SpreadsheetDocument = createEmptyWorkbook({
          sheetName: "Sheet1",
        })
        let docTitle = title
        let bankPrompt: string | null = null

        if (questionId) {
          const bank = await getUtils.client.questions.forSpreadsheet.query({
            id: questionId,
          })
          if (cancelled) return
          docTitle = bank.title || title
          bankPrompt = bank.prompt || null
          if (bank.starterWorkbook?.sheets?.length) {
            document = bank.starterWorkbook as SpreadsheetDocument
          }
        }

        const row = await create.mutateAsync({
          title: docTitle,
          questionId: questionId ?? undefined,
          document: document as never,
        })
        if (cancelled) return
        setWorkbookId(row.id)
        setSeedDoc(row.document as SpreadsheetDocument)
        setPrompt(bankPrompt)
        setReady(true)
      } catch {
        if (cancelled) return
        setWorkbookId(null)
        setSeedDoc(createEmptyWorkbook({ sheetName: "Sheet1" }))
        setPrompt(null)
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, existingId, questionId, title])

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

  return { workbookId, seedDoc, prompt, ready, saveStatus, scheduleSave }
}
