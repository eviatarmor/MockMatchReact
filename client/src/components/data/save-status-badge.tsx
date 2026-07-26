import { useMemo } from "react"
import { Cloud, CloudOff, Loader2 } from "lucide-react"
import type { SaveStatus } from "@/hooks/use-document-autosave"
import { cn } from "@/lib/utils"

interface SaveStatusBadgeProps {
  readonly status: SaveStatus
  readonly labels: {
    readonly saved: string
    readonly saving: string
    readonly error: string
  }
}

/**
 * Cloud badge for editor secondary bar.
 * Always shows icon + label so Saving ↔ Saved is obvious while typing.
 */
export function SaveStatusBadge({ status, labels }: SaveStatusBadgeProps) {
  const { label, icon, className } = useMemo(() => {
    if (status === "saving") {
      return {
        label: labels.saving,
        icon: <Loader2 className="size-3 shrink-0 animate-spin" />,
        className: "bg-muted text-muted-foreground",
      }
    }
    if (status === "error") {
      return {
        label: labels.error,
        icon: <CloudOff className="size-3 shrink-0" />,
        className: "bg-destructive/10 text-destructive",
      }
    }
    // idle + saved
    return {
      label: labels.saved,
      icon: <Cloud className="size-3 shrink-0" />,
      className: "bg-muted text-muted-foreground",
    }
  }, [status, labels])

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs tabular-nums",
        className
      )}
      data-status={status === "idle" ? "saved" : status}
      aria-live="polite"
    >
      {icon}
      <span>{label}</span>
    </span>
  )
}
