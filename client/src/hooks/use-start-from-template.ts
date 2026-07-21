import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  buildCoverLetterFromRoleId,
  buildResumeFromRoleId,
} from "@/lib/document-templates"
import { trpc } from "@/lib/trpc"

export type TemplateKind = "resume" | "cover-letter"

/**
 * Create a draft document from a role template and open the editor.
 */
export function useStartFromTemplate(kind: TemplateKind) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const createResume = trpc.resumes.create.useMutation({
    onSuccess: (doc) => {
      utils.resumes.list.invalidate().catch(() => {})
      toast.success(t("resumeLab.templates.toast.created"))
      navigate(`/resumes/${doc.id}`)
    },
    onError: () => toast.error(t("resumeLab.templates.toast.createFailed")),
    onSettled: () => setPendingId(null),
  })

  const createLetter = trpc.coverLetters.create.useMutation({
    onSuccess: (doc) => {
      utils.coverLetters.list.invalidate().catch(() => {})
      toast.success(t("coverLetters.templates.toast.created"))
      navigate(`/cover-letters/${doc.id}`)
    },
    onError: () => toast.error(t("coverLetters.templates.toast.createFailed")),
    onSettled: () => setPendingId(null),
  })

  const startFromTemplate = useCallback(
    (templateId: string) => {
      if (pendingId) return
      setPendingId(templateId)

      if (kind === "resume") {
        const built = buildResumeFromRoleId(templateId)
        if (!built) {
          toast.error(t("resumeLab.templates.toast.createFailed"))
          setPendingId(null)
          return
        }
        createResume.mutate({
          title: `${built.template.title} — ${built.template.company}`,
          targetRole: built.template.title,
          company: built.template.company,
          templateId: built.template.layoutId,
          style: built.template.style,
          // API DTO expects mutable arrays; seed docs use readonly tuples.
          document: structuredClone(built.document) as never,
        })
        return
      }

      const built = buildCoverLetterFromRoleId(templateId)
      if (!built) {
        toast.error(t("coverLetters.templates.toast.createFailed"))
        setPendingId(null)
        return
      }
      createLetter.mutate({
        title: `${built.template.title} — ${built.template.company}`,
        company: built.template.company,
        templateId: built.template.layoutId,
        style: built.template.style,
        document: structuredClone(built.document) as never,
      })
    },
    [createLetter, createResume, kind, pendingId, t]
  )

  return {
    startFromTemplate,
    pendingId,
    isPending: pendingId !== null,
  }
}
