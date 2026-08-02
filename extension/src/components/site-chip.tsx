import { Building2 } from "lucide-react"
import { Badge } from "@mockmatch/ui/badge"
import { useExtension } from "../state/extension-store"

export function SiteChip() {
  const { form } = useExtension()
  if (form.status !== "detected") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
        <Building2 className="size-4 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">No form on this page</p>
          <p className="text-2xs text-muted-foreground">
            Open a job application to fill
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Building2 className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-foreground">
            {form.company}
          </p>
          <Badge variant="secondary" className="text-2xs">
            {form.site}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{form.role}</p>
        <p className="mt-0.5 text-2xs text-muted-foreground">
          {form.fieldCount} fields detected
        </p>
      </div>
    </div>
  )
}
