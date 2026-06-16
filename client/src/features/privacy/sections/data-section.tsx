import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Download, Ban } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { SectionShell } from "@/features/account-settings/right-pane/section-shell"

interface DataActionCardProps {
  readonly icon: ReactNode
  readonly iconClassName: string
  readonly label: string
  readonly description: string
  readonly buttonLabel: string
  readonly onAction: () => void
}

function DataActionCard({ icon, iconClassName, label, description, buttonLabel, onAction }: DataActionCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconClassName)}>
          {icon}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <Button variant="outline" size="sm" className="w-fit cursor-pointer" onClick={onAction}>
            {buttonLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function DataSection() {
  const { t } = useTranslation("privacy")

  // Both stubbed — no backend wired up yet.
  const requestExport = () =>
    toast.success(t("toast.exportTitle"), { description: t("toast.exportDescription") })
  const clearHistory = () =>
    toast.success(t("toast.clearedTitle"), { description: t("toast.clearedDescription") })

  return (
    <SectionShell heading={t("data.heading")} description={t("data.description")}>
      <div className="flex flex-col gap-3">
        <DataActionCard
          icon={<Download className="size-4" />}
          iconClassName="bg-sky-500/10 text-sky-500"
          label={t("data.export.label")}
          description={t("data.export.description")}
          buttonLabel={t("data.export.button")}
          onAction={requestExport}
        />
        <DataActionCard
          icon={<Ban className="size-4" />}
          iconClassName="bg-amber-500/10 text-amber-500"
          label={t("data.clearHistory.label")}
          description={t("data.clearHistory.description")}
          buttonLabel={t("data.clearHistory.button")}
          onAction={clearHistory}
        />
      </div>
    </SectionShell>
  )
}
