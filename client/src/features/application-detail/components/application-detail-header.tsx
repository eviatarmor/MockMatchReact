import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@mockmatch/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mockmatch/ui/dropdown-menu"
import { useTrackedJobs } from "@/features/applications/hooks/use-tracked-jobs"
import type { TrackedJob } from "@/features/discover/types"

interface ApplicationDetailHeaderProps {
  readonly currentJob: TrackedJob
}

export function ApplicationDetailHeader({ currentJob }: ApplicationDetailHeaderProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const { jobs: trackedJobs } = useTrackedJobs()

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={() => navigate("/applications")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ArrowLeft className="size-4" />
        {t("applicationDetail.backLink")}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="h-8 gap-1.5 cursor-pointer" />
          }
        >
          {t("applicationDetail.switchJob")}
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          {trackedJobs.map((job) => (
            <DropdownMenuItem
              key={job.id}
              className={cn("cursor-pointer", job.id === currentJob.id && "bg-accent")}
              onClick={() => navigate(`/applications/${job.id}`)}
            >
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md text-2xs font-semibold select-none",
                  job.avatarColorClass
                )}
              >
                {job.avatarText}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm">{job.title}</span>
                <span className="truncate text-xs text-muted-foreground">{job.company}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
