import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Mail, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GoogleIcon } from "@/components/icons/google-icon"
import { cn } from "@/lib/utils"
import { useGmailListen } from "../hooks/use-tracked-jobs"
import type { TrackedJob } from "../types"

interface GmailConnectDialogProps {
  readonly jobs: readonly TrackedJob[]
  readonly trigger: React.ReactElement
}

/**
 * Stub Gmail OAuth + per-position email listen prefs.
 * Real Google OAuth / inbox watch lands with the auth backend.
 */
export function GmailConnectDialog({ jobs, trigger }: GmailConnectDialogProps) {
  const { t } = useTranslation("common")
  const { connected, listenJobIds, connect, setListening } = useGmailListen()
  const [open, setOpen] = useState(false)
  const [draftIds, setDraftIds] = useState<string[]>(listenJobIds)

  function handleOpenChange(next: boolean) {
    if (next) setDraftIds(listenJobIds)
    setOpen(next)
  }

  function toggleJob(id: string) {
    setDraftIds((prev) =>
      prev.includes(id) ? prev.filter((jobId) => jobId !== id) : [...prev, id]
    )
  }

  function handleConnect() {
    connect()
    toast.success(t("applications.gmail.connectedToast"))
  }

  function handleSave() {
    setListening(draftIds)
    if (!connected) {
      connect()
      toast.success(t("applications.gmail.connectedListeningToast", {
        count: draftIds.length,
      }))
    } else {
      toast.success(t("applications.gmail.listeningUpdatedToast", {
        count: draftIds.length,
      }))
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            {t("applications.gmail.title")}
          </DialogTitle>
          <DialogDescription>
            {t("applications.gmail.description")}
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              {t("applications.gmail.connectHint")}
            </p>
            <Button
              variant="outline"
              className="w-full gap-2 cursor-pointer"
              onClick={handleConnect}
            >
              <GoogleIcon className="size-4" />
              {t("applications.gmail.connectButton")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            <Check className="size-4 shrink-0" />
            {t("applications.gmail.connectedLabel")}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {t("applications.gmail.listenHeading")}
          </span>
          <p className="text-xs text-muted-foreground">
            {t("applications.gmail.listenHint")}
          </p>

          {jobs.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              {t("applications.gmail.noJobs")}
            </p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {jobs.map((job) => {
                const checked = draftIds.includes(job.id)
                return (
                  <li key={job.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                        checked
                          ? "border-primary/40 bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleJob(job.id)}
                      />
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold select-none",
                          job.avatarColorClass
                        )}
                      >
                        {job.avatarText}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {job.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {job.company}
                        </p>
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setOpen(false)}
          >
            {t("applications.gmail.cancel")}
          </Button>
          <Button
            className="gap-1.5 cursor-pointer"
            disabled={jobs.length === 0 && !connected}
            onClick={handleSave}
          >
            <Mail className="size-4" />
            {connected
              ? t("applications.gmail.saveListening")
              : t("applications.gmail.connectAndListen")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
