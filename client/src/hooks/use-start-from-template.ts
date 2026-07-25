import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  buildCoverLetterFromRoleId,
  buildResumeFromRoleId,
} from "@/lib/document-templates"
import { computeCoverLetterGeneralScore } from "@/features/cover-letter-editor/lib/general-analysis"
import type { CoverLetterDocument } from "@/features/cover-letter-editor/types"
import { computeResumeGeneralScore } from "@/features/resume-editor/lib/general-analysis"
import type { ResumeDocument } from "@/features/resume-editor/types"
import { useRegionPreferences } from "@/hooks/use-region-preferences"
import { trpc } from "@/lib/trpc"

export type TemplateKind = "resume" | "cover-letter"

/**
 * Create a draft document from a role template and open the editor.
 */
export function useStartFromTemplate(kind: TemplateKind) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const { dialect } = useRegionPreferences()
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
        const document = structuredClone(built.document) as never
        void computeResumeGeneralScore(document as ResumeDocument, dialect)
          .then((generalScore) => {
            createResume.mutate({
              title: `${built.template.title} — ${built.template.company}`,
              targetRole: built.template.title,
              company: built.template.company,
              templateId: built.template.layoutId,
              style: built.template.style,
              // API DTO expects mutable arrays; seed docs use readonly tuples.
              document,
              generalScore,
            })
          })
          .catch(() => {
            createResume.mutate({
              title: `${built.template.title} — ${built.template.company}`,
              targetRole: built.template.title,
              company: built.template.company,
              templateId: built.template.layoutId,
              style: built.template.style,
              document,
            })
          })
        return
      }

      const built = buildCoverLetterFromRoleId(templateId)
      if (!built) {
        toast.error(t("coverLetters.templates.toast.createFailed"))
        setPendingId(null)
        return
      }
      const document = structuredClone(built.document) as never
      void computeCoverLetterGeneralScore(document as CoverLetterDocument, dialect)
        .then((generalScore) => {
          createLetter.mutate({
            title: `${built.template.title} — ${built.template.company}`,
            company: built.template.company,
            templateId: built.template.layoutId,
            style: built.template.style,
            document,
            generalScore,
          })
        })
        .catch(() => {
          createLetter.mutate({
            title: `${built.template.title} — ${built.template.company}`,
            company: built.template.company,
            templateId: built.template.layoutId,
            style: built.template.style,
            document,
          })
        })
    },
    [createLetter, createResume, dialect, kind, pendingId, t]
  )

  return {
    startFromTemplate,
    pendingId,
    isPending: pendingId !== null,
  }
}
