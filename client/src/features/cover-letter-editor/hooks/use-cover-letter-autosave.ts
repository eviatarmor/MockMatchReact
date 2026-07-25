import { trpc } from "@/lib/trpc"
import { useDocumentAutosave, type SaveStatus } from "@/hooks/use-document-autosave"
import { useRegionPreferences } from "@/hooks/use-region-preferences"
import type { DocumentStyle } from "@/components/document-editor"
import { computeCoverLetterGeneralScore } from "../lib/general-analysis"
import type { CoverLetterDocument, EditorTemplateId } from "../types"

export type { SaveStatus }

interface UseCoverLetterAutosaveArgs {
  readonly letterId: string
  readonly title: string
  readonly templateId: EditorTemplateId
  readonly style: DocumentStyle
  readonly document: CoverLetterDocument
  readonly enabled: boolean
}

export function useCoverLetterAutosave({
  letterId,
  title,
  templateId,
  style,
  document,
  enabled,
}: UseCoverLetterAutosaveArgs) {
  const utils = trpc.useUtils()
  const { dialect } = useRegionPreferences()
  const update = trpc.coverLetters.update.useMutation()

  return useDocumentAutosave({
    entityId: letterId,
    title,
    templateId,
    style,
    document,
    enabled,
    defaultTitle: "Untitled cover letter",
    mutate: (input, opts) => {
      void (async () => {
        let generalScore: number | undefined
        try {
          generalScore = await computeCoverLetterGeneralScore(
            input.document as CoverLetterDocument,
            dialect
          )
        } catch {
          generalScore = undefined
        }
        update.mutate(
          {
            id: input.id,
            title: input.title,
            templateId: input.templateId as EditorTemplateId,
            style: input.style,
            // Wire DTO is mutable; editor model uses readonly arrays.
            document: input.document as never,
            ...(generalScore !== undefined ? { generalScore } : {}),
          },
          opts
        )
      })()
    },
    onSaved: () => {
      utils.coverLetters.list.invalidate().catch(() => {})
    },
  })
}
