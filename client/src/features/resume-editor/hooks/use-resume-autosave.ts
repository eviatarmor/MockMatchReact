import { trpc } from "@/lib/trpc"
import { useDocumentAutosave, type SaveStatus } from "@/hooks/use-document-autosave"
import { useRegionPreferences } from "@/hooks/use-region-preferences"
import type { DocumentStyle } from "@/components/document-editor"
import { computeResumeGeneralScore } from "../lib/general-analysis"
import type { ResumeDocument, EditorTemplateId } from "../types"

export type { SaveStatus }

interface UseResumeAutosaveArgs {
  readonly resumeId: string
  readonly title: string
  readonly templateId: EditorTemplateId
  readonly document: ResumeDocument
  readonly style: DocumentStyle
  readonly enabled: boolean
}

export function useResumeAutosave({
  resumeId,
  title,
  templateId,
  style,
  document,
  enabled,
}: UseResumeAutosaveArgs) {
  const utils = trpc.useUtils()
  const { dialect } = useRegionPreferences()
  const update = trpc.resumes.update.useMutation()

  return useDocumentAutosave({
    entityId: resumeId,
    title,
    templateId,
    style,
    document,
    enabled,
    defaultTitle: "Untitled resume",
    mutate: (input, opts) => {
      void (async () => {
        let generalScore: number | undefined
        try {
          generalScore = await computeResumeGeneralScore(
            input.document as ResumeDocument,
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
      utils.resumes.list.invalidate().catch(() => {})
    },
  })
}
