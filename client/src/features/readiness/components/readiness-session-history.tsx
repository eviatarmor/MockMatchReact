import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SessionHistoryRow } from "../types"

interface ReadinessSessionHistoryProps {
  readonly rows: readonly SessionHistoryRow[]
}

export function ReadinessSessionHistory({ rows }: ReadinessSessionHistoryProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">{t("readiness.history.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("readiness.history.description")}</p>
        </div>
        <Button variant="outline" className="h-8 gap-1.5 px-3 cursor-pointer">
          <Download className="size-4" />
          <span className="hidden sm:inline">{t("readiness.history.exportCsv")}</span>
        </Button>
      </div>

      <ScrollArea className="w-full">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs text-primary select-none">
              <th className="py-2 pr-4 font-medium">{t("readiness.history.columns.date")}</th>
              <th className="py-2 pr-4 font-medium">{t("readiness.history.columns.role")}</th>
              <th className="py-2 pr-4 font-medium">{t("readiness.history.columns.track")}</th>
              <th className="py-2 pr-4 font-medium">{t("readiness.history.columns.score")}</th>
              <th className="py-2 font-medium">{t("readiness.history.columns.delta")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row) => (
              <tr key={row.id} className="group hover:bg-muted/5 transition-colors">
                <td className="py-3 pr-4 text-sm text-primary">{row.date}</td>
                <td className="py-3 pr-4 text-sm font-semibold group-hover:text-primary transition-colors">{row.role}</td>
                <td className="py-3 pr-4 text-sm text-muted-foreground">{row.track}</td>
                <td className="py-3 pr-4 text-sm font-medium">{row.score}</td>
                <td className="py-3 text-sm font-medium">
                  {row.delta > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">↗ +{row.delta}</span>
                  ) : (
                    <span className="text-red-500 dark:text-red-400">↘ {row.delta}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}
