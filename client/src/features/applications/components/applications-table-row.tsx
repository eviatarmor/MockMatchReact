import { useState } from "react"
import {
  ArrowUpRight,
  FileText,
  Loader2,
  Mail,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mockmatch/ui/select"
import { cn } from "@/lib/utils"
import { useFitDocument } from "@/features/discover/hooks/use-fit-document"
import { jobDetailPath, cacheJobSnapshot } from "@/features/discover/lib/job-snapshot"
import { trackedJobToDiscover } from "@/features/discover/lib/tracked-to-discover"
import { ApplicationMatchBadge } from "./application-match-badge"
import { STATUS_DOT_CLASS, TRACKING_STATUS_ORDER } from "../constants"
import type { TrackedJob, TrackingStatus } from "../types"

interface ApplicationsTableRowProps {
  readonly job: TrackedJob
  readonly onStatusChange: (status: TrackingStatus) => void
  readonly onRemove: () => void
  readonly isColumnVisible?: (columnId: string) => boolean
}

export function ApplicationsTableRow({
  job,
  onStatusChange,
  onRemove,
  isColumnVisible = () => true,
}: ApplicationsTableRowProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const fitDoc = useFitDocument()
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const discoverJob = trackedJobToDiscover(job)

  const statusItems = TRACKING_STATUS_ORDER.map((status) => ({
    value: status,
    label: t(`applications.statusLabels.${status}`),
  }))

  const openDetail = () => {
    cacheJobSnapshot(discoverJob)
    navigate(jobDetailPath(job.id), {
      state: { job: discoverJob, backTo: "/applications" },
    })
  }

  function handleConfirmRemove() {
    setRemoveConfirmOpen(false)
    onRemove()
    toast.message(t("applications.trackingActions.removedToast"))
  }

  return (
    <tr className="group border-b border-border/40 transition-colors hover:bg-muted/5">
      {isColumnVisible("job") ? (
        <td className="py-3 px-4">
          <button
            type="button"
            onClick={openDetail}
            className="flex w-full min-w-0 items-center gap-3 text-left cursor-pointer"
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none",
                job.avatarColorClass
              )}
            >
              {job.avatarText}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                {job.title}
              </span>
              <span className="truncate text-xs text-muted-foreground">{job.company}</span>
            </div>
          </button>
        </td>
      ) : null}

      {isColumnVisible("status") ? (
        <td className="py-3 px-4">
          <Select
            value={job.status}
            onValueChange={(next) => {
              if (typeof next === "string") onStatusChange(next as TrackingStatus)
            }}
            items={statusItems}
          >
            <SelectTrigger
              size="sm"
              className="h-8 min-w-[8.5rem] gap-1.5 border-border/60 bg-muted/30 hover:bg-muted/50"
              aria-label={t("applications.table.columns.status")}
            >
              <span
                className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[job.status])}
                aria-hidden
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[item.value])}
                      aria-hidden
                    />
                    {item.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
      ) : null}

      {isColumnVisible("match") ? (
        <td className="py-3 px-4 text-center">
          <ApplicationMatchBadge
            score={job.matchScore > 0 ? job.matchScore : null}
          />
        </td>
      ) : null}

      {isColumnVisible("location") ? (
        <td className="hidden py-3 px-4 text-sm text-muted-foreground md:table-cell">
          <span className="line-clamp-1">{job.location || "—"}</span>
        </td>
      ) : null}

      {isColumnVisible("nextStep") ? (
        <td className="hidden py-3 px-4 text-sm text-muted-foreground lg:table-cell">
          <span className="line-clamp-1">{job.nextStep || "—"}</span>
        </td>
      ) : null}

      {isColumnVisible("actions") ? (
        <td className="py-3 px-4 text-right">
          <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
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
        </td>
      ) : null}
    </tr>
  )
}
