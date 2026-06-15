import { Sparkles, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

interface AiMatchBannerProps {
  readonly count: number
}

export function AiMatchBanner({ count }: AiMatchBannerProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-primary/5 px-3 py-2">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {t("jobTracker.matchBanner.title", { count })}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("jobTracker.matchBanner.description")}
          </span>
        </div>
      </div>
      <Button size="sm" variant="outline" className="h-8 gap-1.5 shrink-0 cursor-pointer">
        <Plus className="size-4" />
        {t("jobTracker.matchBanner.addJob")}
      </Button>
    </div>
  )
}
