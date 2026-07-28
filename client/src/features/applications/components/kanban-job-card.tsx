import { useState } from "react"
import {
  Clock,
  MoreHorizontal,
  ArrowUpRight,
  FileText,
  Mail,
  Loader2,
  Trash2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@mockmatch/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mockmatch/ui/dropdown-menu"
import { useFitDocument } from "@/features/discover/hooks/use-fit-document"
import { jobDetailPath, cacheJobSnapshot } from "@/features/discover/lib/job-snapshot"
import { trackedJobToDiscover } from "@/features/discover/lib/tracked-to-discover"
import { ApplicationMatchBadge } from "./application-match-badge"
import { TrackingProgressDots } from "./tracking-progress-dots"
import type { TrackedJob } from "../types"

interface KanbanJobCardProps {
  readonly job: TrackedJob
  readonly onRemove?: (id: string) => void
}

export function KanbanJobCard({ job, onRemove }: KanbanJobCardProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const fitDoc = useFitDocument()
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const discoverJob = trackedJobToDiscover(job)
  const openDetail = () => {
    cacheJobSnapshot(discoverJob)
    navigate(jobDetailPath(job.id), {
      state: { job: discoverJob, backTo: "/applications" },
    })
  }
  function handleConfirmRemove() {
    setRemoveConfirmOpen(false)
    onRemove?.(job.id)
    toast.message(t("applications.trackingActions.removedToast"))
  }

  return (
    <div
      onClick={openDetail}
      className="flex flex-col gap-2.5 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-primary cursor-pointer"
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold select-none",
            job.avatarColorClass
          )}
        >
          {job.avatarText}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">{job.title}</span>
          <span className="truncate text-xs text-muted-foreground">{job.company} · {job.location}</span>
        </div>
        {/* stopPropagation on pointer/mouse so card drag handle (asHandle) doesn't steal the menu */}
        <div
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <MoreHorizontal className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuItem className="cursor-pointer" onClick={openDetail}>
                  <ArrowUpRight className="size-4" />
                  {t("applications.trackingActions.openDetails")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={fitDoc.isFitting}
                  onClick={() => fitDoc.fitResume(discoverJob)}
                >
                  {fitDoc.isFittingResume ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                  {t("applications.trackingActions.fitResume")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={fitDoc.isFitting}
                  onClick={() => fitDoc.fitCoverLetter(discoverJob)}
                >
                  {fitDoc.isFittingCoverLetter ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                  {t("applications.trackingActions.fitCoverLetter")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => setRemoveConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  {t("applications.trackingActions.remove")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("applications.trackingActions.removeConfirm.title")}
                </DialogTitle>
                <DialogDescription>
                  {t("applications.trackingActions.removeConfirm.message", {
                    title: job.title,
                  })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline" className="cursor-pointer" />}
                >
                  {t("applications.trackingActions.removeConfirm.cancel")}
                </DialogClose>
                <Button
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={handleConfirmRemove}
                >
                  {t("applications.trackingActions.removeConfirm.confirm")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <TrackingProgressDots
          totalSteps={job.progressSteps}
          completedSteps={job.progressCompleted}
          activeStepIndex={job.activeStepIndex}
        />
        <ApplicationMatchBadge
          score={job.matchScore > 0 ? job.matchScore : null}
        />
      </div>

      {job.nextStep && (
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground">
          <Clock className="size-3 shrink-0" />
          <span className="truncate">{job.nextStep}</span>
          {job.nextStepDate && job.nextStepDate !== "no date" && (
            <span className="ml-auto shrink-0 text-foreground/60">· {job.nextStepDate}</span>
          )}
        </div>
      )}
    </div>
  )
}
