import { useMemo } from "react"
import { trpc } from "@/lib/trpc"
import { collectRoleHintsFromResumes } from "../lib/track-filters"
import type { TrackRoleFamily } from "../types"

/**
 * Derives role families from the user's resumes (`targetRole` + title)
 * so track browse can highlight recommended interview tracks.
 */
export function useResumeRoleHints() {
  const query = trpc.resumes.list.useQuery({
    page: 1,
    pageSize: 50,
  })

  const hints = useMemo(() => {
    const items = query.data?.items ?? []
    return collectRoleHintsFromResumes(
      items.map((row) => ({
        title: row.title,
        targetRole: row.targetRole,
      }))
    )
  }, [query.data?.items])

  const hasResumes = (query.data?.total ?? 0) > 0
  const canRecommend = hints.families.length > 0

  return {
    families: hints.families as readonly TrackRoleFamily[],
    sourceLabels: hints.sourceLabels,
    hasResumes,
    canRecommend,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
