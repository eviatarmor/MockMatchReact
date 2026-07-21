import { trpc } from "@/lib/trpc"
import { useDocumentAutosave, type SaveStatus } from "@/hooks/use-document-autosave"
import type { DocumentStyle } from "@/components/document-editor"
import type { ResumeDocument, EditorTemplateId } from "../types"

export type { SaveStatus }

interface UseResumeAutosaveArgs {
  readonly resumeId: string
  readonly title: string
  readonly templateId: EditorTemplateId
  readonly style: DocumentStyle
  readonly document: ResumeDocument
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
      update.mutate(
        {
          id: input.id,
          title: input.title,
          templateId: input.templateId as EditorTemplateId,
          style: input.style,
          // Wire DTO is mutable; editor model uses readonly arrays.
          document: input.document as never,
        },
        opts
      )
    },
    onSaved: () => {
      utils.resumes.list.invalidate().catch(() => {})
    },
  })
}
