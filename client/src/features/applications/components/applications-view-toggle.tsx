import { LayoutList, Kanban } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

export type ApplicationsView = "list" | "kanban"

interface ApplicationsViewToggleProps {
  readonly view: ApplicationsView
  readonly onChange: (view: ApplicationsView) => void
}

export function ApplicationsViewToggle({ view, onChange }: ApplicationsViewToggleProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
      {(["list", "kanban"] as const).map((v) => {
        const Icon = v === "list" ? LayoutList : Kanban
        const label = t(`applications.views.${v}`)
        return (
          <button
            key={v}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => onChange(v)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer",
              view === v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        )
      })}
    </div>
  )
}
