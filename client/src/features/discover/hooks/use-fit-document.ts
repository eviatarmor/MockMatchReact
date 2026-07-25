import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"
import type { DiscoverJob } from "../types"

function jobStub(job: DiscoverJob) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    description: job.description.slice(0, 2000),
    category: job.category,
    location: job.location,
  }
}

/**
 * Fit resume / cover letter mutations for Discover job details.
 * Creates a new draft and navigates to the editor on success.
 */
export function useFitDocument() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()

  const fitResume = trpc.jobs.fitResume.useMutation({
    onSuccess: (data) => {
      toast.success(t("discover.fitDoc.resumeSuccessTitle"), {
        description: t("discover.fitDoc.resumeSuccessDescription", {
          score: data.fitScore.score,
        }),
      })
      navigate(`/resumes/${data.documentId}`)
    },
    onError: (err) => {
      const msg = err.message ?? ""
      if (err.data?.code === "FORBIDDEN" || /credit/i.test(msg)) {
        toast.message(t("discover.fitDoc.creditsTitle"), {
          description: t("discover.fitDoc.creditsDescription"),
        })
        return
      }
      if (err.data?.code === "PRECONDITION_FAILED") {
        toast.message(t("discover.fitDoc.needResumeTitle"), {
          description: msg || t("discover.fitDoc.needResumeDescription"),
        })
        return
      }
      toast.error(t("discover.fitDoc.resumeError"))
    },
  })

  const fitCoverLetter = trpc.jobs.fitCoverLetter.useMutation({
    onSuccess: (data) => {
      toast.success(t("discover.fitDoc.coverSuccessTitle"), {
        description: t("discover.fitDoc.coverSuccessDescription", {
          score: data.fitScore.score,
        }),
      })
      navigate(`/cover-letters/${data.documentId}`)
    },
    onError: (err) => {
      const msg = err.message ?? ""
      if (err.data?.code === "FORBIDDEN" || /credit/i.test(msg)) {
        toast.message(t("discover.fitDoc.creditsTitle"), {
          description: t("discover.fitDoc.creditsDescription"),
        })
        return
      }
      if (err.data?.code === "PRECONDITION_FAILED") {
        toast.message(t("discover.fitDoc.needResumeTitle"), {
          description: msg || t("discover.fitDoc.needResumeDescription"),
        })
        return
      }
      toast.error(t("discover.fitDoc.coverError"))
    },
  })

  const runFitResume = useCallback(
    (job: DiscoverJob) => {
      fitResume.mutate({ job: jobStub(job) })
    },
    [fitResume]
  )

  const runFitCoverLetter = useCallback(
    (job: DiscoverJob) => {
      fitCoverLetter.mutate({ job: jobStub(job) })
    },
    [fitCoverLetter]
  )

  return {
    fitResume: runFitResume,
    fitCoverLetter: runFitCoverLetter,
    isFittingResume: fitResume.isPending,
    isFittingCoverLetter: fitCoverLetter.isPending,
    isFitting: fitResume.isPending || fitCoverLetter.isPending,
  }
}
