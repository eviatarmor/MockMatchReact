import { useCallback, useEffect, useMemo, useState } from "react"
import { useDetailPanel } from "@/hooks/use-detail-panel"
import { DiscoverFilterBar } from "./discover-filter-bar"
import { DiscoverJobCard } from "./discover-job-card"
import { JobDetailsPanel } from "./job-details-panel"
import { STRONG_MATCH_THRESHOLD } from "../constants"
import type { DiscoverFilterKey, DiscoverJob, EmploymentType } from "../types"

type SortOption = "bestMatch" | "newest" | "salary"

function parseMinSalary(range: string): number {
  const match = range.match(/\$(\d+)K/)
  return match ? Number(match[1]) * 1000 : 0
}

function matchesFilter(job: DiscoverJob, key: DiscoverFilterKey): boolean {
  switch (key) {
    case "remote":
      return job.remoteType === "remote"
    case "new":
      return job.isNew
    case "strongMatch":
      return job.matchScore >= STRONG_MATCH_THRESHOLD
  }
}

interface DiscoverTabProps {
  readonly jobs: DiscoverJob[]
}

export function DiscoverTab({ jobs: allJobs }: DiscoverTabProps) {
  const [activeFilters, setActiveFilters] = useState<ReadonlySet<DiscoverFilterKey>>(new Set())
  const [minSalary, setMinSalary] = useState(0)
  const [employmentTypes, setEmploymentTypes] = useState<ReadonlySet<EmploymentType>>(new Set())
  const [sort, setSort] = useState<SortOption>("bestMatch")
  const { open, close } = useDetailPanel()

  const viewDetails = useCallback(
    (job: DiscoverJob) => {
      open(<JobDetailsPanel job={job} onClose={close} />)
    },
    [open, close]
  )

  useEffect(() => close, [close])

  const toggleFilter = useCallback((key: DiscoverFilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const toggleEmploymentType = useCallback((type: EmploymentType) => {
    setEmploymentTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const jobs = useMemo(() => {
    let result = allJobs.filter(
      (job) =>
        [...activeFilters].every((key) => matchesFilter(job, key)) &&
        parseMinSalary(job.salaryRange) >= minSalary &&
        (employmentTypes.size === 0 || employmentTypes.has(job.employmentType))
    )
    if (sort === "newest") {
      result = [...result].sort((a, b) => a.postedAt.localeCompare(b.postedAt))
    } else if (sort === "bestMatch") {
      result = [...result].sort((a, b) => b.matchScore - a.matchScore)
    } else if (sort === "salary") {
      result = [...result].sort((a, b) => parseMinSalary(b.salaryRange) - parseMinSalary(a.salaryRange))
    }
    return result
  }, [allJobs, activeFilters, minSalary, employmentTypes, sort])

  return (
    <div className="flex flex-col gap-3">
      <DiscoverFilterBar
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        minSalary={minSalary}
        onMinSalaryChange={setMinSalary}
        employmentTypes={employmentTypes}
        onToggleEmploymentType={toggleEmploymentType}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="flex flex-col gap-2">
        {jobs.map((job) => (
          <DiscoverJobCard key={job.id} job={job} onViewDetails={viewDetails} />
        ))}
      </div>
    </div>
  )
}
