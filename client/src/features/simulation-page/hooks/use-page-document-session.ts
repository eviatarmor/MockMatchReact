import { useCallback, useEffect, useRef, useState } from "react"
import { trpc } from "@/lib/trpc"

type SaveStatus = "idle" | "saving" | "saved" | "error"

export type PageBody = { version: 1; html: string }

/**
 * Creates a durable freeform page (optional bank seed) and autosaves.
 * Collab via document_kind `page`.
 */
export function usePageDocumentSession(opts: {
  readonly title: string
  readonly enabled: boolean
  readonly seedHtml: string
  readonly existingId?: string | null
  readonly questionId?: string | null
}) {
  const { title, enabled, seedHtml, existingId, questionId } = opts
  const [pageId, setPageId] = useState<string | null>(null)
  const [seedDoc, setSeedDoc] = useState<PageBody | null>(null)
  const [prompt, setPrompt] = useState<string | null>(null)
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
          setPrompt(null)
          setReady(true)
          return
        }

        let html = seedHtml
        let docTitle = title
        let bankPrompt: string | null = null

        if (questionId) {
          const bank = await getUtils.client.questions.forPage.query({
            id: questionId,
          })
          if (cancelled) return
          docTitle = bank.title || title
          bankPrompt = bank.prompt || null
          if (bank.starterHtml?.trim()) {
            html = bank.starterHtml
          } else if (bank.prompt) {
            html = `<h1>${escapeHtml(bank.title)}</h1><p><em>${escapeHtml(bank.prompt)}</em></p><p></p>`
          }
        }

        const row = await create.mutateAsync({
          title: docTitle,
          questionId: questionId ?? undefined,
          document: { version: 1, html },
        })
        if (cancelled) return
        setPageId(row.id)
        setSeedDoc(row.document as PageBody)
        setPrompt(bankPrompt)
        setReady(true)
      } catch {
        if (cancelled) return
        setPageId(null)
        setSeedDoc({ version: 1, html: seedHtml })
        setPrompt(null)
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, existingId, questionId, title, seedHtml])

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

  return { pageId, seedDoc, prompt, ready, saveStatus, scheduleSave }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
