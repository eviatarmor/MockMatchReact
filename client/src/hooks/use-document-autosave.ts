import { useEffect, useRef, useState } from "react"
import type { DocumentStyleDto } from "@mockmatch/schemas"
import type { DocumentStyle } from "@/components/document-editor"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UpdateVariables {
  readonly id: string
  readonly title: string
  readonly templateId: string
  readonly style: DocumentStyleDto
  readonly document: unknown
}

interface UseDocumentAutosaveArgs {
  readonly entityId: string
  readonly title: string
  readonly templateId: string
  readonly style: DocumentStyle
  readonly document: unknown
  readonly enabled: boolean
  readonly defaultTitle: string
  readonly mutate: (
    input: UpdateVariables,
    opts: {
      onSuccess: () => void
      onError: () => void
    }
  ) => void
  readonly onSaved?: () => void
}

const DEBOUNCE_MS = 800

function toWireDocument(document: unknown): unknown {
  return JSON.parse(JSON.stringify(document))
}

/**
 * Debounced autosave for document editors (resume, cover letter).
 * Domain modules supply the mutation; this owns timing + save status only.
 */
export function useDocumentAutosave({
  entityId,
  title,
  templateId,
  style,
  document,
  enabled,
  defaultTitle,
  mutate,
  onSaved,
}: UseDocumentAutosaveArgs) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const seqRef = useRef(0)
  const skipFirstRef = useRef(true)
  const mutateRef = useRef(mutate)
  const onSavedRef = useRef(onSaved)
  mutateRef.current = mutate
  onSavedRef.current = onSaved

  useEffect(() => {
    skipFirstRef.current = true
    setStatus("idle")
  }, [entityId])

  useEffect(() => {
    if (!enabled) return

    if (skipFirstRef.current) {
      skipFirstRef.current = false
      setStatus("saved")
      return
    }

    const seq = ++seqRef.current
    setStatus("saving")

    const timer = window.setTimeout(() => {
      mutateRef.current(
        {
          id: entityId,
          title: title.trim() || defaultTitle,
          templateId,
          style: { ...style } as DocumentStyleDto,
          document: toWireDocument(document),
        },
        {
          onSuccess: () => {
            if (seq !== seqRef.current) return
            setStatus("saved")
            onSavedRef.current?.()
          },
          onError: () => {
            if (seq !== seqRef.current) return
            setStatus("error")
          },
        }
      )
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [enabled, entityId, title, templateId, style, document, defaultTitle])

  return { status, isSaving: status === "saving" }
}
