import { useCallback, useEffect, useRef, useState } from "react"
import { trpc } from "@/lib/trpc"

type SaveStatus = "idle" | "saving" | "saved" | "error"

export type PageBody = { version: 1; html: string }

/**
 * Creates a durable freeform page and debounced-autosaves HTML body.
 * Collab via document_kind `page`.
 */
export function usePageDocumentSession(opts: {
  readonly title: string
  readonly enabled: boolean
  readonly seedHtml: string
  readonly existingId?: string | null
}) {
  const { title, enabled, seedHtml, existingId } = opts
  const [pageId, setPageId] = useState<string | null>(null)
  const [seedDoc, setSeedDoc] = useState<PageBody | null>(null)
  const [ready, setReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const create = trpc.pageDocuments.create.useMutation()
  const update = trpc.pageDocuments.update.useMutation()
  const getUtils = trpc.useUtils()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    idRef.current = pageId
  }, [pageId])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setReady(false)
    void (async () => {
      try {
        if (existingId) {
          const row = await getUtils.client.pageDocuments.get.query({
            id: existingId,
          })
          if (cancelled) return
          setPageId(row.id)
          setSeedDoc(row.document as PageBody)
          setReady(true)
          return
        }
        const row = await create.mutateAsync({
          title,
          document: { version: 1, html: seedHtml },
        })
        if (cancelled) return
        setPageId(row.id)
        setSeedDoc(row.document as PageBody)
        setReady(true)
      } catch {
        if (cancelled) return
        setPageId(null)
        setSeedDoc({ version: 1, html: seedHtml })
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, existingId, title, seedHtml])

  const scheduleSave = useCallback(
    (html: string) => {
      const id = idRef.current
      if (!id) return
      if (timerRef.current) clearTimeout(timerRef.current)
      setSaveStatus("saving")
      timerRef.current = setTimeout(() => {
        void update
          .mutateAsync({ id, document: { version: 1, html } })
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

  return { pageId, seedDoc, ready, saveStatus, scheduleSave }
}
