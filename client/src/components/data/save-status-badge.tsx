import { useMemo } from "react"
import { Cloud, CloudOff, Loader2 } from "lucide-react"
import type { SaveStatus } from "@/hooks/use-document-autosave"

interface SaveStatusBadgeProps {
  readonly status: SaveStatus
  readonly labels: {
    readonly saved: string
    readonly saving: string
    readonly error: string
  }
}

export function SaveStatusBadge({ status, labels }: SaveStatusBadgeProps) {
  const label = useMemo(() => {
    if (status === "saving") return labels.saving
    if (status === "error") return labels.error
    return labels.saved
  }, [status, labels])

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        {label}
      </span>
    )
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
        <CloudOff className="size-3" />
        {label}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Cloud className="size-3" />
      {label}
    </span>
  )
}
