import { useMemo, useState } from "react"
import { DiscoverFilterBar } from "./discover-filter-bar"
import { AiMatchBanner } from "./ai-match-banner"
import { DiscoverJobCard } from "./discover-job-card"
import { MOCK_DISCOVER_JOBS } from "../constants"
import type { SeniorityLevel } from "../types"

type SeniorityFilter = "all" | SeniorityLevel
type SortOption = "bestMatch" | "newest" | "salary"

export function DiscoverTab() {
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [seniorityFilter, setSeniorityFilter] = useState<SeniorityFilter>("all")
  const [sort, setSort] = useState<SortOption>("bestMatch")

  const jobs = useMemo(() => {
    let result = MOCK_DISCOVER_JOBS
    if (remoteOnly) {
      result = result.filter((job) => job.remoteType === "remote")
    }
    if (seniorityFilter !== "all") {
      result = result.filter((job) => job.seniority === seniorityFilter)
    }
    if (sort === "newest") {
      result = [...result].sort((a, b) => a.postedAt.localeCompare(b.postedAt))
    } else if (sort === "bestMatch") {
      result = [...result].sort((a, b) => b.matchScore - a.matchScore)
    }
    return result
  }, [remoteOnly, seniorityFilter, sort])

  return (
    <div className="flex flex-col gap-3">
      <DiscoverFilterBar
        remoteOnly={remoteOnly}
        onRemoteOnlyChange={setRemoteOnly}
        seniorityFilter={seniorityFilter}
        onSeniorityFilterChange={setSeniorityFilter}
        sort={sort}
        onSortChange={setSort}
      />

      <AiMatchBanner count={jobs.length} />

      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <DiscoverJobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
